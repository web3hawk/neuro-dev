import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  message,
  Select
} from 'antd';
import {
  RocketOutlined
} from '@ant-design/icons';
import api from '../utils/apiClient';
const { useState, useEffect } = React;

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface CreateProjectValues {
  name: string;
  description: string;
  vendors: string[];
  model: string;
}

function ProjectCreate() {
  const [form] = Form.useForm<CreateProjectValues>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await api.get('/api/models');
      if ((response as any).data?.success) {
        setModels((response as any).data.data || []);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      message.error('加载模型失败');
    }
  };

  const onFinish = async (values: CreateProjectValues) => {
    setLoading(true);
    try {
      const response = await api.post('/api/projects', {
        name: values.name,
        description: values.description,
        vendors: values.vendors ? values.vendors.join(',') : '',
        model: values.model
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


  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card bordered={false}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <RocketOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={2}>创建新的软件项目</Title>
          <Paragraph style={{ fontSize: 16, color: '#666' }}>
            使用AI驱动的ChatDev自动生成完整的软件应用程序
          </Paragraph>
        </div>

        <Row gutter={[32, 32]}>
          <Col xs={24} lg={24}>
            <Card size="small" bordered={false}>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
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
                    placeholder="例如：对象存储项目"
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

                <Form.Item
                  label="参考厂商"
                  name="vendors"
                  rules={[
                    { required: false, message: '请选择参考厂商' }
                  ]}
                >
                  <Select
                    mode="multiple"
                    placeholder="请选择参考厂商"
                    size="large"
                    options={[
                      { label: '阿里云', value: '阿里云' },
                      { label: '谷歌云', value: '谷歌云' },
                      { label: '华为云', value: '华为云' },
                      { label: '亚马逊云', value: '亚马逊云' }
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  label="选择模型"
                  name="model"
                  rules={[
                    { required: true, message: '请选择AI模型！' }
                  ]}
                >
                  <Select
                    placeholder="请选择AI模型"
                    size="large"
                    loading={models.length === 0}
                  >
                    {models.map((model: any) => (
                      <Select.Option key={model.id} value={model.id}>
                        {model.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

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

        </Row>
      </Card>
    </div>
  );
}

export default ProjectCreate;
