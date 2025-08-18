import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Progress,
  message,
  Empty,
  Input,
  Select,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  PlayCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../utils/apiClient';
const { useState, useEffect } = React;

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  organization: string;
  model: string;
  status: 'created' | 'running' | 'completed' | 'failed' | string;
  progress: number;
  created_at: any;
  updated_at: any;
  tasks: { id: string; name: string; status: string }[];
}

function ProjectList({ showHistory = false }: { showHistory?: boolean }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const mockProjects: ProjectItem[] = [
        {
          id: 'project_1',
          name: 'Gomoku Game',
          description: 'Develop a basic Gomoku game with AI opponent',
          organization: 'DefaultOrganization',
          model: 'GPT_3_5_TURBO',
          status: 'completed',
          progress: 100,
          created_at: new Date(Date.now() - 86400000 * 2),
          updated_at: new Date(Date.now() - 86400000 * 1),
          tasks: [
            { id: 'task_1', name: 'Game Logic', status: 'completed' },
            { id: 'task_2', name: 'AI Algorithm', status: 'completed' },
            { id: 'task_3', name: 'UI Design', status: 'completed' }
          ]
        },
        {
          id: 'project_2',
          name: 'Weather Dashboard',
          description: 'Build a weather dashboard with current conditions and forecasts',
          organization: 'DefaultOrganization',
          model: 'GPT_4',
          status: 'running',
          progress: 65,
          created_at: new Date(Date.now() - 86400000 * 1),
          updated_at: new Date(Date.now() - 3600000 * 2),
          tasks: [
            { id: 'task_4', name: 'API Integration', status: 'completed' },
            { id: 'task_5', name: 'Dashboard UI', status: 'in_progress' },
            { id: 'task_6', name: 'Data Visualization', status: 'pending' }
          ]
        },
        {
          id: 'project_3',
          name: 'Task Manager',
          description: 'Create a task management application with user authentication',
          organization: 'MyCompany',
          model: 'GPT_3_5_TURBO',
          status: 'created',
          progress: 0,
          created_at: new Date(Date.now() - 3600000 * 6),
          updated_at: new Date(Date.now() - 3600000 * 6),
          tasks: []
        }
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      message.error('加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartProject = async (projectId: string) => {
    try {
      const response = await api.post(`/api/projects/${projectId}/start`);
      if ((response as any).data?.success) {
        message.success('项目启动成功！');
        loadProjects();
        navigate(`/project/${projectId}`);
      }
    } catch (error) {
      console.error('Failed to start project:', error);
      message.error('启动项目失败');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    message.success('项目删除成功！');
    loadProjects();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'created': 'default',
      'running': 'processing',
      'completed': 'success',
      'failed': 'error'
    };
    return colors[status] || 'default';
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ProjectItem) => (
        <Space direction="vertical" size={0}>
          <Button 
            type="link" 
            style={{ padding: 0, fontWeight: 'bold' }}
            onClick={() => navigate(`/project/${record.id}`)}
          >
            {text}
          </Button>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.description.length > 50 ? `${record.description.substring(0, 50)}...` : record.description}
          </Typography.Text>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: ProjectItem) => (
        <Space direction="vertical" size={0}>
          <Tag color={getStatusColor(status)}>
            {status.toUpperCase()}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {record.tasks.length} 个任务
          </Typography.Text>
        </Space>
      )
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record: ProjectItem) => (
        <div style={{ width: 120 }}>
          <Progress 
            percent={progress} 
            size="small" 
            status={record.status === 'failed' ? 'exception' : 'active'}
          />
        </div>
      )
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      render: (model: string) => <Tag>{model}</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: any) => moment(date).format('MMM DD, YYYY HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: ProjectItem) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => navigate(`/project/${record.id}`)}
          >
            查看
          </Button>
          {record.status === 'created' && (
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />} 
              size="small"
              onClick={() => handleStartProject(record.id)}
            >
              启动
            </Button>
          )}
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            size="small"
            onClick={() => handleDeleteProject(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  const stats = {
    total: projects.length,
    running: projects.filter(p => p.status === 'running').length,
    completed: projects.filter(p => p.status === 'completed').length,
    created: projects.filter(p => p.status === 'created').length
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={18}>
            <Title level={2} style={{ margin: 0 }}>
              <ProjectOutlined /> {showHistory ? '项目历史' : '项目'}
            </Title>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/create')}
            >
              新建项目
            </Button>
          </Col>
        </Row>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="项目总数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="运行中" value={stats.running} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已创建" value={stats.created} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Search
              placeholder="搜索项目..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="按状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="created">已创建</Option>
              <Option value="running">运行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="failed">失败</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Projects Table */}
      <Card>
        {filteredProjects.length === 0 && !loading ? (
          <Empty
            description="No projects found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/create')}>
              Create Your First Project
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns as any}
            dataSource={filteredProjects}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} of ${total} items`
            }}
          />
        )}
      </Card>
    </div>
  );
}

export default ProjectList;
