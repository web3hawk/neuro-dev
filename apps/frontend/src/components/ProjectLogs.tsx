import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Spin, Button, Space, Alert, Progress } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../utils/apiClient';

const { Title, Text } = Typography;

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface ProjectStatus {
  status: string;
  progress: number;
  total_tasks: number;
  completed_tasks: number;
}

const ProjectLogs: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProjectStatus = async () => {
    try {
      const response = await api.get(`/api/projects/${id}/status`);
      const statusData = response.data as ProjectStatus;
      setProjectStatus(statusData);
      
      // If project is completed, stop polling and redirect
      if (statusData.status === 'completed') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Wait a bit before redirecting to show completion
        setTimeout(() => {
          navigate(`/project/${id}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to fetch project status:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      console.log('Fetching logs for project:', id);
      const response = await api.get(`/api/projects/${id}/logs`);
      console.log('Logs API response:', response);
      console.log('Response data:', response.data);
      
      // Add null checking and fallback for logs data
      const logsData = response.data.data.logs ?? [];
      console.log('Extracted logs data:', logsData);
      console.log('Logs data type:', typeof logsData);
      console.log('Logs data length:', logsData.length);
      
      // Convert logs to LogEntry format
      const logEntries: LogEntry[] = logsData.map((log, index) => ({
        timestamp: new Date(Date.now() - (logsData.length - index) * 1000).toISOString(),
        level: 'info',
        message: log
      }));
      
      console.log('Converted log entries:', logEntries);
      setLogs(logEntries);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setError('获取日志失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setError('项目ID不存在');
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchProjectStatus();
    fetchLogs();

    // Set up polling for real-time updates
    intervalRef.current = setInterval(() => {
      fetchProjectStatus();
      fetchLogs();
    }, 2000); // Poll every 2 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const handleBack = () => {
    navigate('/projects');
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchProjectStatus();
    fetchLogs();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'processing';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '运行中';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      default: return '未知状态';
    }
  };

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回项目列表
          </Button>
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
          />
        </Space>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回项目列表
            </Button>
            <Title level={3} style={{ margin: 0 }}>项目启动日志</Title>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
        </div>

        {/* Status Card */}
        {projectStatus && (
          <Card title="项目状态" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>状态: </Text>
                <Text type={getStatusColor(projectStatus.status) === 'error' ? 'danger' : 'success'}>
                  {getStatusText(projectStatus.status)}
                </Text>
              </div>
              <div>
                <Text strong>进度: </Text>
                <Progress 
                  percent={projectStatus.progress} 
                  status={getStatusColor(projectStatus.status) as any}
                  format={() => `${projectStatus.completed_tasks}/${projectStatus.total_tasks} 任务`}
                />
              </div>
            </Space>
          </Card>
        )}

        {/* Logs Card */}
        <Card 
          title="实时日志" 
          size="small"
          extra={loading && <Spin size="small" />}
        >
          <div 
            style={{ 
              height: '400px', 
              overflowY: 'auto', 
              backgroundColor: '#f5f5f5', 
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '12px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px'
            }}
          >
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
                {loading ? '加载日志中...' : '暂无日志'}
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </Text>
                  <Text style={{ marginLeft: '8px' }}>
                    {log.message}
                  </Text>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </Card>

        {/* Completion Message */}
        {projectStatus?.status === 'completed' && (
          <Alert
            message="项目启动完成!"
            description="项目已成功启动，即将跳转到项目详情页面..."
            type="success"
            showIcon
          />
        )}
      </Space>
    </div>
  );
};

export default ProjectLogs;