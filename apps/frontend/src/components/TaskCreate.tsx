import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Alert,
  Row,
  Col,
  Divider,
  message
} from 'antd';
import {
  ApiOutlined,
  RocketOutlined,
  UnorderedListOutlined,
  BulbOutlined
} from '@ant-design/icons';
import api from '../utils/apiClient';
import TaskForm, { TaskFormValues } from './TaskForm';
const { useState, useEffect } = React;

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

interface ProjectItem { id: string | number; name: string; }

function TaskCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectId, setProjectId] = useState<string | number | undefined>(undefined);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await api.get('/api/projects');
      const payload = (res as any).data;
      if (payload?.success && Array.isArray(payload.data)) {
        setProjects(payload.data as ProjectItem[]);
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
      message.error('加载项目列表失败');
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    if (!projectId) {
      message.warning('请先选择所属项目');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post(`/api/projects/${projectId}/tasks`, values);
      if ((response as any).data?.success) {
        message.success('任务创建成功！');
        navigate(`/project/${projectId}`);
      } else {
        message.error('创建任务失败');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      message.error('创建任务失败');
    } finally {
      setLoading(false);
    }
  };

  const taskExamples = [
    '实现用户注册与登录功能，包含输入校验与错误提示。',
    '为商品列表页面添加搜索和分页功能。',
    '修复移动端页面在Safari上的布局问题。',
    '为后端API编写集成测试用例。',
    '完善项目README，添加部署与使用说明。'
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <UnorderedListOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={2}>创建新的任务</Title>
          <Paragraph style={{ fontSize: 16, color: '#666' }}>
            为项目添加一个新的任务，帮助AI更好地规划与执行
          </Paragraph>
        </div>

        <Row gutter={[32, 32]}>
          <Col xs={24} lg={16}>
            <Card title={<><ApiOutlined /> 任务配置</>} size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert type="info" message="首先选择该任务所属的项目，然后填写任务信息" showIcon />
                <Form layout="vertical">
                  <Form.Item label="所属项目" required>
                    <Select
                      placeholder="选择所属项目"
                      value={projectId as any}
                      onChange={(val) => setProjectId(val)}
                      size="large"
                      showSearch
                      optionFilterProp="children"
                    >
                      {(projects || []).map(p => (
                        <Option key={p.id as any} value={p.id as any}>{p.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Form>

                <Divider />

                <TaskForm
                  onSubmit={onSubmit}
                  onCancel={() => navigate('/tasks')}
                />

                <Space style={{ width: '100%', justifyContent: 'center' }}>
                  <Button onClick={() => navigate('/tasks')}>取消</Button>
                  <Button type="primary" icon={<RocketOutlined />} loading={loading} onClick={() => {
                    // trigger TaskForm submit
                    const form = document.querySelector('form');
                    if (form) {
                      (form as HTMLFormElement).requestSubmit();
                    }
                  }}>创建任务</Button>
                </Space>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card title={<><BulbOutlined /> 示例任务</>} size="small">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {taskExamples.map((example, index) => (
                    <div key={index}>
                      <Button
                        type="link"
                        size="small"
                        style={{ height: 'auto', padding: 0, textAlign: 'left' }}
                        onClick={() => {
                          // Fill TaskForm fields by dispatching input events
                          const inputs = document.querySelectorAll('.ant-modal-body input, .ant-modal-body textarea');
                          // Not in a modal here; target TaskForm fields directly
                          const nameInput = document.querySelector('input[placeholder="例如：用户登录功能"]') as HTMLInputElement | null;
                          const descInput = document.querySelector('textarea[placeholder="详细描述这个任务的功能需求和预期结果..."]') as HTMLTextAreaElement | null;
                          if (nameInput && descInput) {
                            nameInput.value = example.substring(0, 20);
                            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                            descInput.value = example;
                            descInput.dispatchEvent(new Event('input', { bubbles: true }));
                          }
                        }}
                      >
                        <Text style={{ fontSize: 12 }}>{example}</Text>
                      </Button>
                    </div>
                  ))}
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default TaskCreate;
