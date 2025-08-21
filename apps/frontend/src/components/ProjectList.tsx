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
  EditOutlined,
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
  estimated_cost: number;
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
      const res = await api.get('/api/projects');
      if ((res as any).ok && (res as any).data?.success) {
        const list = (res as any).data.data as ProjectItem[];
        // Ensure progress is present; if not, compute from tasks
        const normalized = list.map(p => {
          const total = p.tasks?.length || 0;
          const completed = (p.tasks || []).filter(t => t.status === 'completed').length;
          const progress = total > 0 ? Math.round((completed / total) * 100) : (p.progress || 0);
          return { ...p, progress } as ProjectItem;
        });
        setProjects(normalized);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      message.error('加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartProject = async (projectId: string) => {
    try {
      // Start the project in the backend
      api.post(`/api/projects/${projectId}/start`).then(response => {
        if ((response as any).data?.success) {
          message.success('项目启动成功！');
          loadProjects();
        }
      }).catch(error => {
        console.error('Failed to start project:', error);
        message.error('启动项目失败');
      });
      
      // Immediately redirect to logs page without waiting for completion
      message.info('正在启动项目，跳转到日志页面...');
      navigate(`/project/${projectId}/logs`);
    } catch (error) {
      console.error('Failed to initiate project start:', error);
      message.error('启动项目失败');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await api.delete(`/api/projects/${projectId}`);
      if ((response as any).data?.success) {
        message.success('项目删除成功！');
        loadProjects();
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      message.error('删除项目失败');
    }
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'created': '已创建',
      'running': '开发中',
      'completed': '已完成',
      'failed': '失败'
    };
    return labels[status] || status.toUpperCase();
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
            {getStatusLabel(status)}
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
      title: '预计成本',
      dataIndex: 'estimated_cost',
      key: 'estimated_cost',
      render: (cost: number) => (
        <span style={{ fontWeight: 500 }}>
          ¥{cost ? cost.toFixed(2) : '0.00'}
        </span>
      )
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
            icon={<EditOutlined />} 
            size="small"
            onClick={() => navigate(`/project/${record.id}/edit`)}
          >
            编辑
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
            <Statistic title="开发中" value={stats.running} valueStyle={{ color: '#1890ff' }} />
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
              <Option value="running">开发中</Option>
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
