import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Alert
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

function TaskForm({ task, onSubmit, onCancel }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      // Pre-fill form with existing task data
      form.setFieldsValue({
        name: task.name,
        description: task.description,
        type: task.type || 'feature',
        priority: task.priority || 3,
        requirements: task.requirements
      });
    } else {
      // Reset form for new task
      form.resetFields();
      form.setFieldsValue({
        type: 'feature',
        priority: 3
      });
    }
  }, [task, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
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

  return (
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
        message="任务信息"
        description="请填写详细的任务信息，这将帮助AI更好地理解和执行任务。"
        type="info"
        style={{ marginBottom: 16 }}
      />

      <Form.Item
        label="任务名称"
        name="name"
        rules={[
          { required: true, message: '请输入任务名称！' },
          { min: 3, message: '任务名称至少需要3个字符' },
          { max: 50, message: '任务名称不能超过50个字符' }
        ]}
      >
        <Input 
          placeholder="例如：用户登录功能"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label="任务描述"
        name="description"
        rules={[
          { required: true, message: '请输入任务描述！' },
          { min: 10, message: '任务描述至少需要10个字符' },
          { max: 500, message: '任务描述不能超过500个字符' }
        ]}
      >
        <TextArea
          placeholder="详细描述这个任务的功能需求和预期结果..."
          rows={3}
          size="large"
          showCount
          maxLength={500}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="任务类型"
            name="type"
            rules={[{ required: true, message: '请选择任务类型！' }]}
          >
            <Select size="large" placeholder="选择任务类型">
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

      <Form.Item
        label="技术要求"
        name="requirements"
        extra="描述特殊的技术要求、框架偏好、性能指标等（可选）"
      >
        <TextArea
          placeholder="例如：使用React Hooks，支持移动端，需要数据缓存..."
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
            onClick={onCancel}
            icon={<CloseOutlined />}
          >
            取消
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            icon={<SaveOutlined />}
          >
            {task ? '更新任务' : '创建任务'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

export default TaskForm;