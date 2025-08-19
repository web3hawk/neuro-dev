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
  SettingOutlined,
  BulbOutlined
} from '@ant-design/icons';
import api from '../utils/apiClient';
const { useState, useEffect } = React;

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CreateProjectValues {
  name: string;
  description: string;
  organization: string;
  model: string;
  config?: string;
}

function ProjectCreate() {
  const [form] = Form.useForm<CreateProjectValues>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const [modelsRes, companiesRes] = await Promise.all([
        api.get('/api/models'),
        api.get('/api/config/companies')
      ]);
      
      let serverModels: string[] = [];
      if ((modelsRes as any).data?.success) {
        serverModels = (modelsRes as any).data.data || [];
      }
      const localCustom = JSON.parse(localStorage.getItem('chatdev-models') || '[]');
      const merged = Array.from(new Set([...(serverModels || []), ...(Array.isArray(localCustom) ? localCustom : [])]));
      setModels(merged);
      
      if ((companiesRes as any).data?.success) {
        setCompanies((companiesRes as any).data.data);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      const localCustom = JSON.parse(localStorage.getItem('chatdev-models') || '[]');
      if (Array.isArray(localCustom)) {
        setModels(localCustom);
      }
      message.error('加载配置失败');
    }
  };

  const onFinish = async (values: CreateProjectValues) => {
    setLoading(true);
    try {
      const response = await api.post('/api/projects', {
        name: values.name,
        description: values.description,
        organization: values.organization,
        model: values.model,
        config: values.config || 'Default'
      });

      if ((response as any).data?.success) {
        message.success('项目创建成功！');
        navigate(`/project/${(response as any).data.data.id}`);
      } else {
        message.error('创建项目失败');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      message.error('创建项目失败');
    } finally {
      setLoading(false);
    }
  };

  const taskExamples = [
    "开发一个基础的五子棋游戏。",
    "创建一个带有用户认证的任务管理应用。",
    "构建一个显示当前状况和预报的天气仪表板。",
    "设计一个具有搜索功能的简单电商产品目录。",
    "开发一个带有支出分类的个人财务跟踪器。"
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <RocketOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={2}>创建新的软件项目</Title>
          <Paragraph style={{ fontSize: 16, color: '#666' }}>
            使用AI驱动的ChatDev自动生成完整的软件应用程序
          </Paragraph>
        </div>

        <Row gutter={[32, 32]}>
          <Col xs={24} lg={16}>
            <Card title={<><ApiOutlined /> 项目配置</>} size="small">
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                  organization: 'DefaultOrganization',
                  model: 'GPT_3_5_TURBO',
                  config: 'Default'
                }}
              >
                <Form.Item
                  label="项目名称"
                  name="name"
                  rules={[
                    { required: true, message: '请输入项目名称！' },
                    { min: 2, message: '项目名称至少需要2个字符' }
                  ]}
                >
                  <Input 
                    placeholder="例如：五子棋游戏"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="项目描述"
                  name="description"
                  rules={[
                    { required: true, message: '请描述您想要构建的软件！' },
                    { min: 10, message: '描述至少需要10个字符' }
                  ]}
                >
                  <TextArea
                    placeholder="描述您想要创建的软件类型..."
                    rows={4}
                    size="large"
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="组织机构"
                      name="organization"
                      rules={[{ required: true, message: '请输入组织机构！' }]}
                    >
                      <Input 
                        placeholder="您的组织机构名称"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="AI 模型"
                      name="model"
                      rules={[{ required: true, message: '请选择一个AI模型！' }]}
                    >
                      <Select size="large" placeholder="选择AI模型">
                        {models.map(model => (
                          <Option key={model} value={model}>{model}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="公司配置"
                  name="config"
                >
                  <Select size="large" placeholder="选择配置">
                    {companies.map(company => (
                      <Option key={company} value={company}>{company}</Option>
                    ))}
                  </Select>
                </Form.Item>

                <Divider />

                <Form.Item>
                  <Space style={{ width: '100%', justifyContent: 'center' }}>
                    <Button 
                      size="large"
                      onClick={() => navigate('/projects')}
                    >
                      取消
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      size="large"
                      icon={<RocketOutlined />}
                    >
                      创建项目
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
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
                        onClick={() => form.setFieldsValue({ task: example } as any)}
                      >
                        <Text style={{ fontSize: 12 }}>{example}</Text>
                      </Button>
                    </div>
                  ))}
                </Space>
              </Card>

              <Card title={<><SettingOutlined /> 工作原理</>} size="small">
                <Space direction="vertical" size="small">
                  <div><Text strong>1. 需求分析</Text><br />
                  <Text type="secondary">AI分析需求并确定产品类型</Text></div>
                  
                  <div><Text strong>2. 语言选择</Text><br />
                  <Text type="secondary">选择最佳的编程语言</Text></div>
                  
                  <div><Text strong>3. 代码生成</Text><br />
                  <Text type="secondary">生成完整的应用程序代码</Text></div>
                  
                  <div><Text strong>4. 美术与UI设计</Text><br />
                  <Text type="secondary">创建美观的用户界面</Text></div>
                  
                  <div><Text strong>5. 测试与审查</Text><br />
                  <Text type="secondary">测试并完善应用程序</Text></div>
                </Space>
              </Card>

              <Alert
                message="AI驱动的开发"
                description="ChatDev使用多个AI智能体协同工作，自动创建完整、功能齐全的软件应用程序。"
                type="info"
                showIcon
              />
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default ProjectCreate;
