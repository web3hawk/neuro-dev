import * as React from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Progress,
  message,
  Modal,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Empty
} from 'antd';
import {
  PlayCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../utils/apiClient';
import TaskForm from './TaskForm';
const { useState, useEffect } = React;

const { Title, Text } = Typography;

// Types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export interface TaskItem {
  id: string | number;
  name: string;
  description?: string;
  type?: string;
  status: TaskStatus;
  priority?: number;
  progress?: number;
  current_phase?: string;
  estimated_days?: number;
  estimated_cost?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  [key: string]: any;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

interface TaskListProps {
  projectId?: string | number;
  onTaskUpdate?: (stats: TaskStats) => void;
}

function TaskList({ projectId, onTaskUpdate }: TaskListProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [taskFormVisible, setTaskFormVisible] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });

  useEffect(() => {
    if (projectId) {
      loadTasks();
    }
  }, [projectId]);

  useEffect(() => {
    calculateStats();
  }, [tasks]);

  // Poll task statuses to reflect real-time progress without mock data
  useEffect(() => {
    if (!projectId) return;
    const active = tasks.filter(t => t.status === 'in_progress');
    if (active.length === 0) return;
    const timer = setInterval(async () => {
      try {
        const updates = await Promise.all(
          active.map(async (t) => {
            const res = await api.get(`/api/tasks/${t.id}/status`);
            if ((res as any).data?.success) {
              const d = (res as any).data.data || {};
              return { id: t.id, ...d };
            }
            return null as any;
          })
        );
        const map = new Map<string | number, any>();
        updates.filter(Boolean).forEach((u: any) => map.set(u.id || (u as any).task_id, u));
        setTasks(prev => prev.map(t => {
          const u = map.get(t.id);
          return u ? { ...t, status: u.status, progress: u.progress, current_phase: u.current_phase, updated_at: u.updated_at } : t;
        }));
      } catch (e) {
        // ignore
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [projectId, tasks]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/projects/${projectId}/tasks`);
      if ((response as any).data?.success) {
        setTasks((response as any).data.data as TaskItem[]);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      message.error('加载任务失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const inProgress = tasks.filter(task => task.status === 'in_progress').length;
    const pending = tasks.filter(task => task.status === 'pending').length;
    
    setStats({ total, completed, inProgress, pending });
    
    if (onTaskUpdate) {
      onTaskUpdate({ total, completed, inProgress, pending });
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskFormVisible(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setTaskFormVisible(true);
  };

  const handleStartTask = async (taskId: string | number) => {
    try {
      const response = await api.post(`/api/tasks/${taskId}/start`);
      if ((response as any).data?.success) {
        message.success('任务启动成功！');
        loadTasks();
      }
    } catch (error) {
      console.error('Failed to start task:', error);
      message.error('启动任务失败');
    }
  };

  const handleDeleteTask = async (taskId: string | number) => {
    try {
      const response = await api.delete(`/api/tasks/${taskId}`);
      if ((response as any).data?.success) {
        message.success('任务删除成功！');
        loadTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      message.error('删除任务失败');
    }
  };

  const handleTaskFormSubmit = async (taskData: any) => {
    try {
      let response: any;
      if (editingTask) {
        response = await api.put(`/api/tasks/${editingTask.id}`, taskData);
      } else {
        response = await api.post(`/api/projects/${projectId}/tasks`, taskData);
      }
      
      if (response.data?.success) {
        message.success(editingTask ? '任务更新成功！' : '任务创建成功！');
        setTaskFormVisible(false);
        setEditingTask(null);
        loadTasks();
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      message.error('保存任务失败');
    }
  };

  const getStatusTag = (status: TaskStatus) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode | null; text: string }> = {
      pending: { color: 'default', icon: <ClockCircleOutlined />, text: '待执行' },
      in_progress: { color: 'processing', icon: <SyncOutlined spin />, text: '执行中' },
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
      failed: { color: 'error', icon: null, text: '失败' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Tag color={config.color} icon={config.icon as any}>
        {config.text}
      </Tag>
    );
  };

  const getPriorityTag = (priority?: number) => {
    const colors: Record<number, string> = {
      1: 'red',
      2: 'orange', 
      3: 'gold',
      4: 'green',
      5: 'blue'
    };
    return <Tag color={colors[priority || 0] || 'default'}>优先级 {priority}</Tag>;
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TaskItem) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {record.description?.substring(0, 50)}...
          </div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type || '功能'}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: getPriorityTag
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record: TaskItem) => (
        <div style={{ width: 100 }}>
          <Progress 
            percent={progress} 
            size="small"
            status={record.status === 'failed' ? 'exception' : 'normal'}
          />
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.current_phase}
          </div>
        </div>
      )
    },
    {
      title: '预计天数',
      dataIndex: 'estimated_days',
      key: 'estimated_days',
      render: (days: number) => days ? <Tag color="cyan">{days}天</Tag> : <Tag color="default">未设置</Tag>
    },
    {
      title: '预计成本',
      dataIndex: 'estimated_cost',
      key: 'estimated_cost',
      render: (cost: number) => cost ? <Tag color="green">¥{cost.toLocaleString()}</Tag> : <Tag color="default">未设置</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: any) => moment(date).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: TaskItem) => (
        <Space>
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartTask(record.id)}
            >
              执行
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTask(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个任务吗？"
            onConfirm={() => handleDeleteTask(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) {
    return <Card loading />;
  }

  return (
    <div>
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic title="总任务数" value={stats.total} />
        </Col>
        <Col span={6}>
          <Statistic 
            title="已完成" 
            value={stats.completed} 
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="执行中" 
            value={stats.inProgress}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="待执行" 
            value={stats.pending}
            valueStyle={{ color: '#d9d9d9' }}
          />
        </Col>
      </Row>

      {/* Task List */}
      <Card 
        title="项目任务"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateTask}
          >
            添加任务
          </Button>
        }
      >
        {tasks.length === 0 ? (
          <Empty 
            description="暂无任务"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handleCreateTask}>
              创建第一个任务
            </Button>
          </Empty>
        ) : (
          <Table
            dataSource={tasks}
            columns={columns as any}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个任务`
            }}
          />
        )}
      </Card>

      {/* Task Form Modal */}
      <Modal
        title={editingTask ? '编辑任务' : '创建新任务'}
        open={taskFormVisible}
        onCancel={() => {
          setTaskFormVisible(false);
          setEditingTask(null);
        }}
        footer={null}
        width={600}
      >
        <TaskForm
          task={editingTask as any}
          onSubmit={handleTaskFormSubmit}
          onCancel={() => {
            setTaskFormVisible(false);
            setEditingTask(null);
          }}
        />
      </Modal>
    </div>
  );
}

export default TaskList;
