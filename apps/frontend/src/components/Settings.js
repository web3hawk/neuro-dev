import * as React from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  message,
  Alert,
  Switch,
  InputNumber,
  Table,
  Modal,
  Popconfirm
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
const { useState, useEffect } = React;

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

function Settings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState({});
  const [editingRole, setEditingRole] = useState(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [settings, setSettings] = useState({
    defaultModel: 'GPT_3_5_TURBO',
    defaultOrganization: 'DefaultOrganization',
    defaultConfig: 'Default',
    maxConcurrentProjects: 3,
    enableNotifications: true,
    enableAutoSave: true,
    apiTimeout: 30,
    theme: 'light'
  });

  useEffect(() => {
    loadConfiguration();
    loadSettings();
    loadRoles();
  }, []);

  const loadConfiguration = async () => {
    try {
      const [modelsRes, companiesRes] = await Promise.all([
        axios.get('/api/models'),
        axios.get('/api/config/companies')
      ]);
      
      if (modelsRes.data.success) {
        setModels(modelsRes.data.data);
      }
      
      if (companiesRes.data.success) {
        setCompanies(companiesRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      message.error('加载配置失败');
    }
  };

  const loadSettings = () => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('chatdev-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      form.setFieldsValue(parsed);
    } else {
      form.setFieldsValue(settings);
    }
  };

  const loadRoles = async () => {
    try {
      // Load roles from RoleConfig.json
      const response = await fetch('/CompanyConfig/Default/RoleConfig.json');
      if (response.ok) {
        const roleData = await response.json();
        setRoles(roleData);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
      // Load default Chinese roles if file not found
      const defaultRoles = {
        "首席执行官": [
          "{chatdev_prompt}",
          "您是首席执行官。现在，我们都在 ChatDev 工作，我们有着共同的兴趣，希望能够协作完成新客户分配的任务。",
          "您的主要职责包括成为用户需求和其他关键政策问题的积极决策者、领导者、管理者和执行者。您的决策角色涉及关于政策和战略的高级决策；您的沟通角色可能涉及与组织的管理层和员工交流。",
          "这是一个新客户的任务：{task}。",
          "为了完成这个任务，我会给您一个或多个指令，您必须根据您的专业知识和我的需求，帮助我编写一个适当解决所要求指令的具体解决方案。"
        ]
      };
      setRoles(defaultRoles);
    }
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setRoleModalVisible(true);
  };

  const handleEditRole = (roleName) => {
    const roleData = roles[roleName];
    setEditingRole({ 
      name: roleName, 
      prompts: Array.isArray(roleData) ? roleData : roleData.prompts || [],
      model: Array.isArray(roleData) ? settings.defaultModel : roleData.model || settings.defaultModel
    });
    setRoleModalVisible(true);
  };

  const handleDeleteRole = (roleName) => {
    const updatedRoles = { ...roles };
    delete updatedRoles[roleName];
    setRoles(updatedRoles);
    saveRoles(updatedRoles);
    message.success(`已删除角色: ${roleName}`);
  };

  const handleSaveRole = (roleData) => {
    const updatedRoles = { ...roles };
    
    // If editing, remove old role name
    if (editingRole && editingRole.name !== roleData.name) {
      delete updatedRoles[editingRole.name];
    }
    
    // Save role with new structure that includes model information
    updatedRoles[roleData.name] = {
      prompts: roleData.prompts,
      model: roleData.model || settings.defaultModel
    };
    
    setRoles(updatedRoles);
    saveRoles(updatedRoles);
    setRoleModalVisible(false);
    message.success(editingRole ? '角色更新成功！' : '角色添加成功！');
  };

  const saveRoles = async (roleData) => {
    try {
      // In a real implementation, this would save to the server
      // For now, we'll save to localStorage as a backup
      localStorage.setItem('chatdev-roles', JSON.stringify(roleData));
    } catch (error) {
      console.error('Failed to save roles:', error);
      message.error('保存角色失败');
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      // Save settings to localStorage (in production, save to API)
      const updatedSettings = { ...settings, ...values };
      localStorage.setItem('chatdev-settings', JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
      
      message.success('设置保存成功！');
    } catch (error) {
      console.error('Failed to save settings:', error);
      message.error('保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      defaultModel: 'GPT_3_5_TURBO',
      defaultOrganization: 'DefaultOrganization',
      defaultConfig: 'Default',
      maxConcurrentProjects: 3,
      enableNotifications: true,
      enableAutoSave: true,
      apiTimeout: 30,
      theme: 'light'
    };
    
    form.setFieldsValue(defaultSettings);
    setSettings(defaultSettings);
    message.info('设置已重置为默认值');
  };


  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <SettingOutlined /> 设置
        </Title>
        <Paragraph type="secondary">
          配置ChatDev应用程序首选项和默认值
        </Paragraph>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={settings}
      >
        <Card title="默认项目设置" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="默认AI模型"
                name="defaultModel"
                rules={[{ required: true }]}
              >
                <Select placeholder="选择默认AI模型">
                  {models.map(model => (
                    <Option key={model} value={model}>{model}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="默认配置"
                name="defaultConfig"
                rules={[{ required: true }]}
              >
                <Select placeholder="选择默认配置">
                  {companies.map(company => (
                    <Option key={company} value={company}>{company}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="默认组织机构"
            name="defaultOrganization"
            rules={[{ required: true }]}
          >
            <Input placeholder="输入默认组织机构名称" />
          </Form.Item>
        </Card>

        <Card title="应用程序设置" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="最大并发项目数"
                name="maxConcurrentProjects"
                rules={[{ required: true, type: 'number', min: 1, max: 10 }]}
              >
                <InputNumber 
                  min={1} 
                  max={10} 
                  style={{ width: '100%' }}
                  placeholder="最大并发项目数"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="API超时时间（秒）"
                name="apiTimeout"
                rules={[{ required: true, type: 'number', min: 10, max: 300 }]}
              >
                <InputNumber 
                  min={10} 
                  max={300} 
                  style={{ width: '100%' }}
                  placeholder="API request timeout"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Enable Notifications"
                name="enableNotifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Enable Auto Save"
                name="enableAutoSave"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Theme"
                name="theme"
              >
                <Select>
                  <Option value="light">Light</Option>
                  <Option value="dark">Dark</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="成员设置" style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddRole}
            >
              添加角色
            </Button>
          </div>
          
          <Table
            dataSource={Object.keys(roles).map(roleName => {
              const roleData = roles[roleName];
              const isOldFormat = Array.isArray(roleData);
              return {
                key: roleName,
                name: roleName,
                description: isOldFormat ? 
                  (roleData[1] ? roleData[1].substring(0, 100) + '...' : '无描述') :
                  (roleData.prompts && roleData.prompts[1] ? roleData.prompts[1].substring(0, 100) + '...' : '无描述'),
                model: isOldFormat ? settings.defaultModel : (roleData.model || settings.defaultModel)
              };
            })}
            columns={[
              {
                title: '角色名称',
                dataIndex: 'name',
                key: 'name',
                width: 150,
              },
              {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
              },
              {
                title: '使用模型',
                dataIndex: 'model',
                key: 'model',
                width: 150,
                render: (model) => (
                  <span style={{ color: '#1890ff' }}>{model}</span>
                )
              },
              {
                title: '操作',
                key: 'action',
                width: 150,
                render: (_, record) => (
                  <Space size="small">
                    <Button 
                      size="small" 
                      icon={<EditOutlined />} 
                      onClick={() => handleEditRole(record.name)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定要删除这个角色吗？"
                      onConfirm={() => handleDeleteRole(record.name)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button 
                        size="small" 
                        danger 
                        icon={<DeleteOutlined />}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <Card>
          <Space style={{ width: '100%', justifyContent: 'center' }}>
            <Button 
              onClick={handleReset}
              icon={<ReloadOutlined />}
            >
              Reset to Defaults
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              Save Settings
            </Button>
          </Space>
        </Card>
      </Form>
      
      <RoleModal 
        visible={roleModalVisible}
        editingRole={editingRole}
        models={models}
        onSave={handleSaveRole}
        onCancel={() => setRoleModalVisible(false)}
      />
    </div>
  );
}

// Role Modal Component
const RoleModal = ({ visible, editingRole, models, onSave, onCancel }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (editingRole) {
        // Editing existing role
        form.setFieldsValue({
          roleName: editingRole.name,
          model: editingRole.model,
          prompt1: editingRole.prompts[1] || '',
          prompt2: editingRole.prompts[2] || '',
          prompt3: editingRole.prompts[3] || '',
          prompt4: editingRole.prompts[4] || '',
        });
      } else {
        // Adding new role
        form.resetFields();
      }
    }
  }, [visible, editingRole, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const prompts = [
        "{chatdev_prompt}",
        values.prompt1,
        values.prompt2,
        values.prompt3,
        values.prompt4,
      ].filter(prompt => prompt && prompt.trim() !== "");

      onSave({
        name: values.roleName,
        prompts: prompts,
        model: values.model
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Modal
      title={editingRole ? "编辑角色" : "添加角色"}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="roleName"
          label="角色名称"
          rules={[{ required: true, message: '请输入角色名称' }]}
        >
          <Input placeholder="例如：首席执行官" />
        </Form.Item>

        <Form.Item
          name="model"
          label="使用模型"
          rules={[{ required: true, message: '请选择使用的AI模型' }]}
        >
          <Select placeholder="选择AI模型">
            {models && models.map(model => (
              <Option key={model} value={model}>{model}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="prompt1"
          label="角色介绍"
          rules={[{ required: true, message: '请输入角色介绍' }]}
        >
          <TextArea 
            rows={3} 
            placeholder="描述这个角色的基本信息和工作背景"
          />
        </Form.Item>

        <Form.Item
          name="prompt2"
          label="主要职责"
          rules={[{ required: true, message: '请输入主要职责' }]}
        >
          <TextArea 
            rows={3} 
            placeholder="描述这个角色的主要职责和工作内容"
          />
        </Form.Item>

        <Form.Item
          name="prompt3"
          label="任务说明"
          rules={[{ required: true, message: '请输入任务说明' }]}
        >
          <TextArea 
            rows={2} 
            placeholder="例如：这是一个新客户的任务：{task}。"
          />
        </Form.Item>

        <Form.Item
          name="prompt4"
          label="工作要求"
          rules={[{ required: true, message: '请输入工作要求' }]}
        >
          <TextArea 
            rows={3} 
            placeholder="描述完成任务时的具体要求和期望"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Settings;