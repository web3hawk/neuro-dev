import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Progress,
  Typography,
  Tag,
  Button,
  Space,
  Timeline,
  Tabs,
  List,
  message,
  Spin,
  Alert,
  Divider,
  Statistic
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  FileOutlined,
  ProjectOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import moment from 'moment';
import axios from 'axios';
import TaskList from './TaskList';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });

  useEffect(() => {
    loadProject();
    loadLogs();
    loadFiles();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projects/${id}`);
      if (response.data.success) {
        setProject(response.data.data);
      } else {
        message.error('项目不存在');
        navigate('/projects');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      message.error('加载项目失败');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (stats) => {
    setTaskStats(stats);
  };

  const handleStartProject = async () => {
    try {
      const response = await axios.post(`/api/projects/${id}/start`);
      if (response.data.success) {
        message.success('项目启动成功！');
        loadProject();
      }
    } catch (error) {
      console.error('Failed to start project:', error);
      message.error('启动项目失败');
    }
  };

  const loadLogs = async () => {
    try {
      const response = await axios.get(`/api/projects/${id}/logs`);
      if (response.data.success) {
        setLogs(response.data.data.logs);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await axios.get(`/api/projects/${id}/files`);
      if (response.data.success) {
        setFiles(response.data.data.files);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleDownloadProject = async () => {
    try {
      const response = await axios.post(`/api/projects/${id}/download`);
      if (response.data.success) {
        message.success('项目导出成功!');
        // Handle download URL
        window.open(response.data.data.download_url);
      }
    } catch (error) {
      console.error('Failed to start project:', error);
      message.error('Failed to start project');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'created': 'default',
      'running': 'processing',
      'completed': 'success',
      'failed': 'error'
    };
    return colors[status] || 'default';
  };

  const getProjectProgress = () => {
    if (taskStats.total === 0) return 0;
    return Math.round((taskStats.completed / taskStats.total) * 100);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return (
      <Alert
        message="Project not found"
        description="The requested project could not be found."
        type="error"
        showIcon
        action={
          <Button onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        }
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="center">
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/projects')}
              >
                Back
              </Button>
              <Divider type="vertical" />
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  {project.name}
                </Title>
                <Text type="secondary">{project.description}</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Tag color={getStatusColor(project.status)}>
                {project.status.toUpperCase()}
              </Tag>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadProject}
              >
                刷新
              </Button>
              {project.status === 'created' && (
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={handleStartProject}
                >
                  启动项目
                </Button>
              )}
              {project.status === 'completed' && (
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadProject}
                >
                  下载项目
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Project Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={getProjectProgress()}
                status={project.status === 'failed' ? 'exception' : 'active'}
                width={120}
              />
              <div style={{ marginTop: 16 }}>
                <Text strong>项目进度</Text>
                <br />
                <Text type="secondary">{taskStats.completed}/{taskStats.total} 任务完成</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={taskStats.total}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成"
              value={taskStats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="执行中"
              value={taskStats.inProgress}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Project Info */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="项目信息">
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text type="secondary">组织机构</Text>
                  <br />
                  <Text strong>{project.organization}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text type="secondary">AI模型</Text>
                  <br />
                  <Tag color="blue">{project.model}</Tag>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text type="secondary">创建时间</Text>
                  <br />
                  <Text>{moment(project.created_at).format('YYYY-MM-DD HH:mm')}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text type="secondary">最后更新</Text>
                  <br />
                  <Text>{moment(project.updated_at).fromNow()}</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Task Management */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="任务管理" key="tasks">
            <TaskList 
              projectId={id} 
              onTaskUpdate={handleTaskUpdate}
            />
          </TabPane>

          <TabPane tab="执行日志" key="logs">
            <List
              dataSource={logs}
              renderItem={(log, index) => (
                <List.Item>
                  <Text code style={{ fontSize: 12, fontFamily: 'monospace' }}>
                    {moment().format('HH:mm:ss')} - {log}
                  </Text>
                </List.Item>
              )}
              style={{ maxHeight: 400, overflow: 'auto' }}
              locale={{ emptyText: '暂无日志' }}
            />
          </TabPane>

          <TabPane tab="生成文件" key="files">
            <List
              dataSource={files}
              renderItem={(file) => (
                <List.Item
                  actions={[
                    <Button icon={<EyeOutlined />} size="small">查看</Button>,
                    <Button icon={<DownloadOutlined />} size="small">下载</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileOutlined />}
                    title={file.name}
                    description={`${file.type} • ${file.size} 字节`}
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无生成文件' }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default ProjectDetail;