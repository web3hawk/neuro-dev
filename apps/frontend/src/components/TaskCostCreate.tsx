import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  InputNumber,
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
  BulbOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import api from '../utils/apiClient';
const { useState, useEffect } = React;

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ProjectItem { id: string | number; name: string; }

export interface TaskFormValues {
  name: string;
  description: string;
  type: string;
  priority: number;
  requirements?: string;
  estimated_days?: number;
  estimated_cost?: number;
}

function TaskCostCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm<TaskFormValues>();
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectId, setProjectId] = useState<string | number | undefined>(undefined);
  
  // 获取URL参数确定是预算还是成本
  const searchParams = new URLSearchParams(location.search);
  const expenseType = searchParams.get('expense_type') || 'budget';
  const isCosting = expenseType === 'cost';

  useEffect(() => {
    loadProjects();
    // Set default form values for costing
    form.setFieldsValue({
      type: isCosting ? 'feature' : 'feature',
      priority: 3,
    });
  }, [form, isCosting]);

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

  const handleSubmit = async (values: TaskFormValues) => {
    if (!projectId) {
      message.warning('请先选择所属项目');
      return;
    }
    setFormLoading(true);
    try {
      const taskData = {
        ...values,
        expense_type: expenseType
      };
      const response = await api.post(`/api/projects/${projectId}/tasks`, taskData);
      if ((response as any).data?.success) {
        message.success(isCosting ? '成本创建成功！' : '任务创建成功！');
        navigate(isCosting ? '/tasks/cost' : `/project/${projectId}`);
      } else {
        message.error(isCosting ? '创建成本失败' : '创建任务失败');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      message.error(isCosting ? '创建成本失败' : '创建任务失败');
    } finally {
      setFormLoading(false);
    }
  };

  const taskTypes = [
    { value: 'feature', label: '功能开发', color: '#1890ff' },
    { value: 'bug', label: 'Bug修复', color: '#f5222d' },
    { value: 'enhancement', label: '功能增强', color: '#52c41a' },
    { value: 'refactor', label: '代码重构', color: '#722ed1' },
    { value: 'testing', label: '测试', color: '#fa8c16' },
    { value: 'documentation', label: '文档', color: '#13c2c2' }
  ];

  const priorityOptions = [
    { value: 1, label: '最高优先级', color: '#f5222d' },
    { value: 2, label: '高优先级', color: '#fa8c16' },
    { value: 3, label: '普通优先级', color: '#fadb14' },
    { value: 4, label: '低优先级', color: '#52c41a' },
    { value: 5, label: '最低优先级', color: '#1890ff' }
  ];

  const taskExamples = isCosting ? [
    'ECS云服务器实例费用，规格为2核4G，按月计费。',
    'RDS数据库实例费用，MySQL 5.7版本，存储100GB。',
    'OSS对象存储费用，标准存储类型，存储量50GB。',
    'CDN内容分发网络费用，流量消耗500GB。',
    'SLB负载均衡器费用，性能保障型实例按小时计费。'
  ] : [
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
          <Title level={2}>{isCosting ? '新增云服务成本' : '创建新的任务'}</Title>
          <Paragraph style={{ fontSize: 16, color: '#666' }}>
            {isCosting ? '为项目添加各类云服务的实际成本记录' : '为项目添加一个新的任务，帮助AI更好地规划与执行'}
          </Paragraph>
        </div>

        <Row gutter={[32, 32]}>
          <Col xs={24} lg={16}>
            <Card title={<><ApiOutlined /> {isCosting ? '成本配置' : '任务配置'}</>} size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert type="info" message={isCosting ? "首先选择该成本所属的项目，然后填写云服务成本信息" : "首先选择该任务所属的项目，然后填写任务信息"} showIcon />
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

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{
                    type: 'feature',
                    priority: 3
                  }}
                >
                  <Alert
                    message={isCosting ? "成本信息" : "任务信息"}
                    description={isCosting ? "请填写详细的云服务成本信息，这将帮助更好地管理项目成本。" : "请填写详细的任务信息，这将帮助AI更好地理解和执行任务。"}
                    type="info"
                    style={{ marginBottom: 16 }}
                  />

                  <Form.Item
                    label={isCosting ? "成本名称" : "任务名称"}
                    name="name"
                    rules={[
                      { required: true, message: isCosting ? '请输入成本名称！' : '请输入任务名称！' },
                      { min: 3, message: isCosting ? '成本名称至少需要3个字符' : '任务名称至少需要3个字符' },
                      { max: 50, message: isCosting ? '成本名称不能超过50个字符' : '任务名称不能超过50个字符' }
                    ]}
                  >
                    <Input 
                      placeholder={isCosting ? "例如：ECS云服务器费用" : "例如：用户登录功能"}
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    label={isCosting ? "成本描述" : "任务描述"}
                    name="description"
                    rules={[
                      { required: true, message: isCosting ? '请输入成本描述！' : '请输入任务描述！' },
                      { min: 10, message: isCosting ? '成本描述至少需要10个字符' : '任务描述至少需要10个字符' },
                      { max: 500, message: isCosting ? '成本描述不能超过500个字符' : '任务描述不能超过500个字符' }
                    ]}
                  >
                    <TextArea
                      placeholder={isCosting ? "详细描述云服务的配置、规格和计费方式..." : "详细描述这个任务的功能需求和预期结果..."}
                      rows={3}
                      size="large"
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={isCosting ? "成本类型" : "任务类型"}
                        name="type"
                        rules={[{ required: true, message: isCosting ? '请选择成本类型！' : '请选择任务类型！' }]}
                      >
                        <Select size="large" placeholder={isCosting ? "选择成本类型" : "选择任务类型"}>
                          {taskTypes.map(type => (
                            <Option key={type.value} value={type.value}>
                              <span style={{ color: type.color }}>●</span> {type.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="优先级"
                        name="priority"
                        rules={[{ required: true, message: '请选择优先级！' }]}
                      >
                        <Select size="large" placeholder="选择优先级">
                          {priorityOptions.map(priority => (
                            <Option key={priority.value} value={priority.value}>
                              <span style={{ color: priority.color }}>●</span> {priority.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={isCosting ? "计费周期(天)" : "预计天数"}
                        name="estimated_days"
                        extra={isCosting ? "云服务的计费周期天数" : "预计完成任务所需的工作天数"}
                      >
                        <InputNumber
                          size="large"
                          min={1}
                          max={365}
                          placeholder={isCosting ? "例如：30" : "例如：5"}
                          style={{ width: '100%' }}
                          addonAfter="天"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={isCosting ? "实际成本" : "预计成本"}
                        name="estimated_cost"
                        extra={isCosting ? "云服务的实际费用（元）" : "预计完成任务所需的开发成本（元）"}
                        rules={isCosting ? [{ required: true, message: '请输入实际成本！' }] : []}
                      >
                        <InputNumber<number>
                            size="large"
                            min={0 as number}
                            max={1000000 as number}
                            placeholder={isCosting ? "例如：500" : "例如：12000"}
                            style={{ width: '100%' }}
                            formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => Number((value ?? '').toString().replace(/¥\s?|,/g, ''))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label={isCosting ? "技术规格" : "技术要求"}
                    name="requirements"
                    extra={isCosting ? "描述云服务的技术规格、配置要求等（可选）" : "描述特殊的技术要求、框架偏好、性能指标等（可选）"}
                  >
                    <TextArea
                      placeholder={isCosting ? "例如：2核4G内存，40GB SSD硬盘，1Mbps带宽..." : "例如：使用React Hooks，支持移动端，需要数据缓存..."}
                      rows={2}
                      size="large"
                      showCount
                      maxLength={200}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                      <Button 
                        size="large"
                        onClick={() => navigate('/tasks')}
                        icon={<CloseOutlined />}
                      >
                        取消
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={formLoading}
                        size="large"
                        icon={<SaveOutlined />}
                      >
                        {isCosting ? '创建成本' : '创建任务'}
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>

              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card title={<><BulbOutlined /> {isCosting ? '云服务成本示例' : '示例任务'}</>} size="small">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {taskExamples.map((example, index) => (
                    <div key={index}>
                      <Button
                        type="link"
                        size="small"
                        style={{ height: 'auto', padding: 0, textAlign: 'left' }}
                        onClick={() => {
                          // Fill form fields using form instance
                          const exampleName = example.substring(0, 20) + (example.length > 20 ? '...' : '');
                          form.setFieldsValue({
                            name: exampleName,
                            description: example
                          });
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

export default TaskCostCreate;
