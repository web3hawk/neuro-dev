import * as React from 'react';
import {
  Card,
  Table,
  Space,
  Typography,
  Tag,
  DatePicker,
  Select,
  Input,
  Button,
  Row,
  Col,
  message,
  Progress,
  Tooltip,
  Empty
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import moment, { Moment } from 'moment';
import api from '../utils/apiClient';
const { useState, useEffect } = React;

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

interface ProjectItem { id: string; name: string; }
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | string;
export interface TaskItem {
  id: string | number;
  name: string;
  description: string;
  project_id?: string;
  projectName: string;
  type?: string;
  priority?: number;
  status: TaskStatus;
  progress?: number;
  created_at?: any;
  updated_at?: any;
}

interface Filters {
  projectId: string | null;
  status: TaskStatus | null;
  type: string | null;
  priority: number | null;
  dateRange: [Moment, Moment] | null;
  completionDateRange: [Moment, Moment] | null;
  searchText: string;
}

function TaskExecutionList() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    projectId: null,
    status: null,
    type: null,
    priority: null,
    dateRange: null,
    completionDateRange: null,
    searchText: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const projectsResponse = await api.get('/api/projects');
      if ((projectsResponse as any).data && (projectsResponse as any).data.length > 0) {
        const projectList = (projectsResponse as any).data as ProjectItem[];
        setProjects(projectList);

        const allTasks: TaskItem[] = [];
        for (const project of projectList) {
          try {
            const tasksResponse = await api.get(`/api/projects/${project.id}/tasks`);
            if ((tasksResponse as any).data?.success && (tasksResponse as any).data?.data) {
              const projectTasks = ((tasksResponse as any).data.data as any[]).map(task => ({
                ...task,
                projectName: project.name
              })) as TaskItem[];
              allTasks.push(...projectTasks);
            }
          } catch (error) {
            console.warn(`Failed to load tasks for project ${project.id}:`, error);
          }
        }
        setTasks(allTasks);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    if (filters.projectId) {
      filtered = filtered.filter(task => task.project_id === filters.projectId);
    }

    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter(task => task.type === filters.type);
    }

    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.dateRange && filters.dateRange.length === 2) {
      const [startDate, endDate] = filters.dateRange;
      filtered = filtered.filter(task => {
        const taskDate = moment(task.created_at);
        return taskDate.isBetween(startDate, endDate, 'day', '[]');
        } );
    }

    if (filters.completionDateRange && filters.completionDateRange.length === 2) {
      const [startDate, endDate] = filters.completionDateRange;
      filtered = filtered.filter(task => {
        if (task.status !== 'completed') return false;
        const taskDate = moment(task.updated_at);
        return taskDate.isBetween(startDate, endDate, 'day', '[]');
      });
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(task =>
        task.name.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        (task.projectName || '').toLowerCase().includes(searchLower)
      );
    }

    setFilteredTasks(filtered);
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      projectId: null,
      status: null,
      type: null,
      priority: null,
      dateRange: null,
      completionDateRange: null,
      searchText: ''
    });
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'in_progress':
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'processing';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority?: number) => {
    switch (priority) {
      case 1:
        return 'red';
      case 2:
        return 'orange';
      case 3:
        return 'gold';
      case 4:
        return 'blue';
      case 5:
        return 'green';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TaskItem) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </div>
      ),
    },
    {
      title: '所属项目',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type || '未指定'}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => (
        <Tag color={getPriorityColor(priority)}>
          P{priority || 'N/A'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status === 'completed' ? '已完成' :
           status === 'in_progress' ? '进行中' :
           status === 'failed' ? '失败' : '待处理'}
        </Tag>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress
          percent={progress || 0}
          size="small"
          status={progress === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '分配角色',
      dataIndex: 'assigned_role',
      key: 'assigned_role',
      render: (role: string | undefined) => role ? <Tag color="purple">{role}</Tag> : <Text type="secondary">未分配</Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: any) => (
        <Tooltip title={moment(date).format('YYYY-MM-DD HH:mm:ss')}>
          {moment(date).format('MM-DD HH:mm')}
        </Tooltip>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: any) => (
        <Tooltip title={moment(date).format('YYYY-MM-DD HH:mm:ss')}>
          {moment(date).format('MM-DD HH:mm')}
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={4}>任务</Title>
          <Text type="secondary">
            查看和筛选所有项目的任务执行情况
          </Text>
        </div>

        {/* Filters */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>项目</Text>
                <Select
                  placeholder="选择项目"
                  value={filters.projectId as any}
                  onChange={(value) => handleFilterChange('projectId', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {projects.map(project => (
                    <Option key={project.id} value={project.id}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>

            <Col span={6}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>状态</Text>
                <Select
                  placeholder="选择状态"
                  value={filters.status as any}
                  onChange={(value) => handleFilterChange('status', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="pending">待处理</Option>
                  <Option value="in_progress">进行中</Option>
                  <Option value="completed">已完成</Option>
                  <Option value="failed">失败</Option>
                </Select>
              </Space>
            </Col>

            <Col span={6}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>类型</Text>
                <Select
                  placeholder="选择类型"
                  value={filters.type as any}
                  onChange={(value) => handleFilterChange('type', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="feature">功能</Option>
                  <Option value="bug">Bug修复</Option>
                  <Option value="enhancement">增强</Option>
                  <Option value="maintenance">维护</Option>
                </Select>
              </Space>
            </Col>

            <Col span={6}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>优先级</Text>
                <Select
                  placeholder="选择优先级"
                  value={filters.priority as any}
                  onChange={(value) => handleFilterChange('priority', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value={1}>P1 (最高)</Option>
                  <Option value={2}>P2 (高)</Option>
                  <Option value={3}>P3 (中)</Option>
                  <Option value={4}>P4 (低)</Option>
                  <Option value={5}>P5 (最低)</Option>
                </Select>
              </Space>
            </Col>

            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>创建时间范围</Text>
                <RangePicker
                  value={filters.dateRange as any}
                  onChange={(dates) => handleFilterChange('dateRange', dates as any)}
                  style={{ width: '100%' }}
                  placeholder={['开始时间', '结束时间']}
                />
              </Space>
            </Col>

            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>完成时间范围</Text>
                <RangePicker
                  value={filters.completionDateRange as any}
                  onChange={(dates) => handleFilterChange('completionDateRange', dates as any)}
                  style={{ width: '100%' }}
                  placeholder={['开始时间', '结束时间']}
                />
              </Space>
            </Col>

            <Col span={24}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>搜索</Text>
                <Search
                  placeholder="搜索任务名称、描述或项目名称"
                  value={filters.searchText}
                  onChange={(e) => handleFilterChange('searchText', (e.target as HTMLInputElement).value)}
                  style={{ width: '100%' }}
                  allowClear
                />
              </Space>
            </Col>

            <Col span={24}>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={loadData}>
                  刷新数据
                </Button>
                <Button onClick={resetFilters}>
                  重置筛选
                </Button>
                <Text type="secondary">
                  共找到 {filteredTasks.length} 个任务
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Tasks Table */}
        <Table
          columns={columns as any}
          dataSource={filteredTasks}
          loading={loading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="暂无任务数据"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}

export default TaskExecutionList;
