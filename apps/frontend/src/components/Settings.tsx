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
  Table,
  Modal
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
import api from '../utils/apiClient';
const { useState, useEffect } = React;

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface SettingsValues {
  defaultModel: string;
  defaultOrganization: string;
  defaultConfig: string;
  maxConcurrentProjects: number;
  enableNotifications: boolean;
  enableAutoSave: boolean;
  apiTimeout: number;
  theme: 'light' | 'dark';
}

function Settings() {
  const [form] = Form.useForm<SettingsValues>();
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [newModel, setNewModel] = useState<string>("");
  const [newModelBaseUrl, setNewModelBaseUrl] = useState<string>("");
  const [companies, setCompanies] = useState<string[]>([]);
  const [roles, setRoles] = useState<Record<string, any>>({});
  const [modelTokens, setModelTokens] = useState<Record<string, string>>({});
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [settings, setSettings] = useState<SettingsValues>({
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
    // Clean up unwanted localStorage keys
    const keysToRemove = ['test1', 'test2', 'test', 'zzz', 'xxx', 'aaa'];
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    loadConfiguration();
    loadSettings();
    loadRoles();
  }, []);

  const loadConfiguration = async () => {
    try {
      const [modelsRes, companiesRes] = await Promise.all([
        api.get('/api/models'),
        api.get('/api/config/companies')
      ]);

      let serverModels: any[] = [];
      if ((modelsRes as any).data?.success) {
        serverModels = (modelsRes as any).data.data || [];
      }

      // Load custom models from localStorage and merge (unique by name)
      const localCustom = JSON.parse(localStorage.getItem('chatdev-models') || '[]');
      if (Array.isArray(localCustom)) {
        setCustomModels(localCustom);
        // Convert old string format to new object format for compatibility
        const localCustomObjects = localCustom.map((name: string) => ({
          id: null,
          name: name,
          base_url: '',
          is_custom: true
        }));
        // Merge and remove duplicates by name
        const merged = [...serverModels];
        localCustomObjects.forEach((localModel: any) => {
          if (!merged.find((m: any) => m.name === localModel.name)) {
            merged.push(localModel);
          }
        });
        setModels(merged);
      } else {
        setModels(serverModels);
      }

      // Load model tokens from localStorage
      const storedTokens = JSON.parse(localStorage.getItem('chatdev-modelTokens') || '{}');
      if (storedTokens && typeof storedTokens === 'object') {
        setModelTokens(storedTokens);
      }
      
      if ((companiesRes as any).data?.success) {
        setCompanies((companiesRes as any).data.data);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      // Fallback to local custom models if server fails
      const localCustom = JSON.parse(localStorage.getItem('chatdev-models') || '[]');
      if (Array.isArray(localCustom)) {
        setCustomModels(localCustom);
        setModels(localCustom);
      }
      // Try to still load tokens in fallback
      const storedTokens = JSON.parse(localStorage.getItem('chatdev-modelTokens') || '{}');
      if (storedTokens && typeof storedTokens === 'object') {
        setModelTokens(storedTokens);
      }
      message.error('加载配置失败');
    }
  };

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('chatdev-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings) as SettingsValues;
      setSettings(parsed);
      form.setFieldsValue(parsed);
    } else {
      form.setFieldsValue(settings);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await api.get('/api/config/roles');
      const payload = (res as any).data;
      if (payload?.success) {
        setRoles(payload.data || {});
      } else {
        message.error('加载角色失败');
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
      message.error('加载角色失败');
    }
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setRoleModalVisible(true);
  };

  const handleEditRole = (roleName: string) => {
    const roleData = roles[roleName];
    setEditingRole({ 
      name: roleName, 
      prompts: Array.isArray(roleData) ? roleData : roleData.prompts || [],
      model: Array.isArray(roleData) ? settings.defaultModel : roleData.model || settings.defaultModel
    });
    setRoleModalVisible(true);
  };

  const handleDeleteRole = (roleName: string) => {
    const updatedRoles = { ...roles };
    delete updatedRoles[roleName];
    setRoles(updatedRoles);
    saveRoles(updatedRoles);
    message.success(`已删除角色: ${roleName}`);
  };

  const handleSaveRole = (roleData: any) => {
    const updatedRoles = { ...roles };
    
    if (editingRole && editingRole.name !== roleData.name) {
      delete updatedRoles[editingRole.name];
    }
    
    updatedRoles[roleData.name] = {
      prompts: roleData.prompts,
      model: roleData.model || settings.defaultModel
    };
    
    setRoles(updatedRoles);
    saveRoles(updatedRoles);
    setRoleModalVisible(false);
    message.success(editingRole ? '角色更新成功！' : '角色添加成功！');
  };

  const saveRoles = async (roleData: Record<string, any>) => {
    try {
      localStorage.setItem('chatdev-roles', JSON.stringify(roleData));
    } catch (error) {
      console.error('Failed to save roles:', error);
      message.error('保存角色失败');
    }
  };

  const handleAddModel = async () => {
    const name = (newModel || '').trim();
    const baseUrl = (newModelBaseUrl || '').trim();
    
    if (!name) {
      message.warning('请输入模型名称');
      return;
    }
    
    if (models.find((m: any) => m.name === name)) {
      message.info('该模型已存在');
      return;
    }

    try {
      const response = await api.post('/api/models', {
        name: name,
        base_url: baseUrl
      });

      if ((response as any).data?.success) {
        const newModelObj = (response as any).data.data;
        setModels([...models, newModelObj]);
        
        // Also update localStorage for backward compatibility
        const updatedCustom = Array.from(new Set([...(customModels || []), name]));
        setCustomModels(updatedCustom);
        localStorage.setItem('chatdev-models', JSON.stringify(updatedCustom));
        
        setNewModel('');
        setNewModelBaseUrl('');
        message.success('已添加模型');
      } else {
        message.error('添加模型失败');
      }
    } catch (error) {
      console.error('Failed to add model:', error);
      message.error('添加模型失败');
    }
  };

  const handleEditModel = (model: any) => {
    setEditingModel(model);
    setModelModalVisible(true);
  };

  const handleDeleteModel = async (model: any) => {
    if (!model.id) {
      message.warning('无法删除此模型');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除模型 "${model.name}" 吗？`,
      onOk: async () => {
        try {
          const response = await api.delete(`/api/models/${model.id}`);
          if ((response as any).data?.success) {
            setModels(models.filter((m: any) => m.id !== model.id));
            message.success('模型删除成功');
          } else {
            message.error('删除模型失败');
          }
        } catch (error) {
          console.error('Failed to delete model:', error);
          message.error('删除模型失败');
        }
      }
    });
  };

  const handleUpdateModel = async (modelData: any) => {
    try {
      const response = await api.put(`/api/models/${editingModel.id}`, {
        name: modelData.name,
        base_url: modelData.base_url
      });

      if ((response as any).data?.success) {
        const updatedModel = (response as any).data.data;
        setModels(models.map((m: any) => m.id === editingModel.id ? updatedModel : m));
        setModelModalVisible(false);
        message.success('模型更新成功');
      } else {
        message.error('更新模型失败');
      }
    } catch (error) {
      console.error('Failed to update model:', error);
      message.error('更新模型失败');
    }
  };


  const handleSave = async (values: SettingsValues) => {
    setLoading(true);
    try {
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
    const defaultSettings: SettingsValues = {
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


        <Card title="角色设置" style={{ marginBottom: 24 }}>
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
            ]}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <Card title="模型设置" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={8}>
              <Col span={8}>
                <Input
                  placeholder="模型名称，例如：GPT_4_1"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  onPressEnter={() => handleAddModel()}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="Base URL，例如：https://api.openai.com/v1"
                  value={newModelBaseUrl}
                  onChange={(e) => setNewModelBaseUrl(e.target.value)}
                  onPressEnter={() => handleAddModel()}
                />
              </Col>
              <Col span={4}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddModel()}>
                  添加模型
                </Button>
              </Col>
            </Row>


            <div>
              <Title level={5}>可用模型（包含系统与自定义）</Title>
              <Table
                size="small"
                dataSource={(models || []).map((m) => ({ 
                  key: typeof m === 'string' ? m : m.name, 
                  name: typeof m === 'string' ? m : m.name,
                  base_url: typeof m === 'string' ? '' : (m.base_url || ''),
                  is_custom: typeof m === 'string' ? true : (m.is_custom || false),
                  id: typeof m === 'string' ? null : m.id,
                  originalModel: m
                }))}
                columns={[
                  { title: '模型名称', dataIndex: 'name', key: 'name', width: 200 },
                  { 
                    title: 'Base URL', 
                    dataIndex: 'base_url', 
                    key: 'base_url', 
                    width: 250,
                    render: (text: string) => text || '默认'
                  },
                  {
                    title: 'Token',
                    dataIndex: 'token',
                    key: 'token',
                    width: 200,
                    render: (_: any, record: any) => (
                      <Input.Password
                        placeholder="输入该模型的API Token"
                        value={modelTokens[record.name] || ''}
                        onChange={(e) => {
                          const next = { ...(modelTokens || {}), [record.name]: e.target.value };
                          setModelTokens(next);
                          localStorage.setItem('chatdev-modelTokens', JSON.stringify(next));
                        }}
                      />
                    )
                  },
                  {
                    title: '操作',
                    key: 'actions',
                    width: 120,
                    render: (_: any, record: any) => (
                      <Space>
                        {record.id && (
                          <>
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => handleEditModel(record.originalModel)}
                              title="编辑模型"
                            />
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteModel(record.originalModel)}
                              title="删除模型"
                            />
                          </>
                        )}
                      </Space>
                    )
                  }
                ]}
                pagination={false}
                locale={{ emptyText: '暂无可用模型' }}
              />
            </div>
          </Space>
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
      
      <ModelModal
        visible={modelModalVisible}
        editingModel={editingModel}
        onSave={handleUpdateModel}
        onCancel={() => setModelModalVisible(false)}
      />
    </div>
  );
}

// Role Modal Component
const RoleModal = ({ visible, editingRole, models, onSave, onCancel }: any) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (editingRole) {
        form.setFieldsValue({
          roleName: editingRole.name,
          model: editingRole.model,
          prompt1: editingRole.prompts[1] || '',
          prompt2: editingRole.prompts[2] || '',
          prompt3: editingRole.prompts[3] || '',
          prompt4: editingRole.prompts[4] || '',
        });
      } else {
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
      ].filter((prompt: string) => prompt && prompt.trim() !== "");

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
            {models && models.map((model: any) => {
              const modelName = typeof model === 'string' ? model : model.name;
              return (
                <Option key={modelName} value={modelName}>{modelName}</Option>
              );
            })}
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

// Model Modal Component
const ModelModal = ({ visible, editingModel, onSave, onCancel }: any) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && editingModel) {
      form.setFieldsValue({
        name: editingModel.name,
        base_url: editingModel.base_url || ''
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, editingModel, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSave({
        name: values.name,
        base_url: values.base_url || ''
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Modal
      title="编辑模型"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="name"
          label="模型名称"
          rules={[{ required: true, message: '请输入模型名称' }]}
        >
          <Input placeholder="例如：GPT_4_1" />
        </Form.Item>

        <Form.Item
          name="base_url"
          label="Base URL"
          rules={[{ required: false }]}
        >
          <Input placeholder="例如：https://api.openai.com/v1" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Settings;
