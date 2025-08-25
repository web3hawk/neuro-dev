import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  message,
  Empty,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  DatePicker,
  Tabs
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  FileTextOutlined,
  CloudOutlined,
  DatabaseOutlined,
  ApiOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { useState, useEffect } = React;
const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface BillItem {
  id: string;
  tenant_id: string;
  tenant_name: string;
  service_type: 'object_storage' | 'log_service' | 'computing' | 'network';
  service_name: string;
  resource_id: string;
  usage_amount: number;
  unit: string;
  unit_price: number;
  total_cost: number;
  billing_period: string;
  created_at: string;
  region: string;
}

function BillingList() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'all' | string>('all');
  const [tenantFilter, setTenantFilter] = useState<'all' | string>('all');
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      setLoading(true);
      // Mock data - in real implementation, this would call an API
      const mockBills: BillItem[] = [
        {
          id: '1',
          tenant_id: 'tenant-001',
          tenant_name: '阿里云科技有限公司',
          service_type: 'object_storage',
          service_name: '对象存储 OSS',
          resource_id: 'bucket-prod-001',
          usage_amount: 1024.5,
          unit: 'GB',
          unit_price: 0.12,
          total_cost: 122.94,
          billing_period: '2025-08',
          created_at: '2025-08-22T10:00:00Z',
          region: '华东-1'
        },
        {
          id: '2',
          tenant_id: 'tenant-002',
          tenant_name: '腾讯云计算有限公司',
          service_type: 'log_service',
          service_name: '日志服务 SLS',
          resource_id: 'logstore-app-logs',
          usage_amount: 500.2,
          unit: 'GB',
          unit_price: 0.08,
          total_cost: 40.02,
          billing_period: '2025-08',
          created_at: '2025-08-22T10:00:00Z',
          region: '华东-1'
        },
        {
          id: '3',
          tenant_id: 'tenant-001',
          tenant_name: '阿里云科技有限公司',
          service_type: 'computing',
          service_name: '弹性计算 ECS',
          resource_id: 'i-bp1234567890',
          usage_amount: 720,
          unit: '小时',
          unit_price: 0.45,
          total_cost: 324.00,
          billing_period: '2025-08',
          created_at: '2025-08-22T10:00:00Z',
          region: '华东-1'
        },
        {
          id: '4',
          tenant_id: 'tenant-003',
          tenant_name: '华为云服务有限公司',
          service_type: 'network',
          service_name: '网络服务',
          resource_id: 'nat-gateway-001',
          usage_amount: 1000,
          unit: 'GB',
          unit_price: 0.05,
          total_cost: 50.00,
          billing_period: '2025-08',
          created_at: '2025-08-22T10:00:00Z',
          region: '华东-1'
        },
        {
          id: '5',
          tenant_id: 'tenant-002',
          tenant_name: '腾讯云计算有限公司',
          service_type: 'object_storage',
          service_name: '对象存储 OSS',
          resource_id: 'bucket-test-002',
          usage_amount: 512.3,
          unit: 'GB',
          unit_price: 0.12,
          total_cost: 61.48,
          billing_period: '2025-08',
          created_at: '2025-08-22T11:00:00Z',
          region: '华南-1'
        },
        {
          id: '6',
          tenant_id: 'tenant-003',
          tenant_name: '华为云服务有限公司',
          service_type: 'computing',
          service_name: '弹性计算 ECS',
          resource_id: 'i-hw9876543210',
          usage_amount: 480,
          unit: '小时',
          unit_price: 0.38,
          total_cost: 182.40,
          billing_period: '2025-08',
          created_at: '2025-08-22T12:00:00Z',
          region: '华北-1'
        }
      ];
      setBills(mockBills);
    } catch (error) {
      console.error('Failed to load bills:', error);
      message.error('加载账单失败');
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (serviceType: string) => {
    const icons: Record<string, React.ReactElement> = {
      'object_storage': <DatabaseOutlined />,
      'log_service': <FileTextOutlined />,
      'computing': <CloudOutlined />,
      'network': <ApiOutlined />
    };
    return icons[serviceType] || <CloudOutlined />;
  };

  const getServiceColor = (serviceType: string) => {
    const colors: Record<string, string> = {
      'object_storage': 'blue',
      'log_service': 'green',
      'computing': 'orange',
      'network': 'purple'
    };
    return colors[serviceType] || 'default';
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.service_name.toLowerCase().includes(searchText.toLowerCase()) ||
                         bill.resource_id.toLowerCase().includes(searchText.toLowerCase()) ||
                         bill.tenant_name.toLowerCase().includes(searchText.toLowerCase());
    const matchesService = serviceFilter === 'all' || bill.service_type === serviceFilter;
    const matchesTenant = tenantFilter === 'all' || bill.tenant_id === tenantFilter;
    const matchesTab = activeTab === 'all' || bill.service_type === activeTab;
    
    let matchesDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const billDate = moment(bill.created_at);
      matchesDate = billDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
    }
    
    return matchesSearch && matchesService && matchesTenant && matchesTab && matchesDate;
  });

  const columns = [
    {
      title: '租户',
      dataIndex: 'tenant_name',
      key: 'tenant_name',
      render: (tenantName: string) => (
        <Tag color="cyan">{tenantName}</Tag>
      )
    },
    {
      title: '服务类型',
      dataIndex: 'service_type',
      key: 'service_type',
      render: (serviceType: string, record: BillItem) => (
        <Space>
          {getServiceIcon(serviceType)}
          <span>{record.service_name}</span>
        </Space>
      )
    },
    {
      title: '资源ID',
      dataIndex: 'resource_id',
      key: 'resource_id',
      render: (text: string) => (
        <Typography.Text code>{text}</Typography.Text>
      )
    },
    {
      title: '用量',
      key: 'usage',
      render: (_: any, record: BillItem) => (
        <span>{record.usage_amount} {record.unit}</span>
      )
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number, record: BillItem) => (
        <span>¥{price.toFixed(4)}/{record.unit}</span>
      )
    },
    {
      title: '费用',
      dataIndex: 'total_cost',
      key: 'total_cost',
      render: (cost: number) => (
        <span style={{ fontWeight: 'bold', color: '#f50' }}>
          ¥{cost.toFixed(2)}
        </span>
      )
    },
    {
      title: '计费周期',
      dataIndex: 'billing_period',
      key: 'billing_period'
    },
    {
      title: '地域',
      dataIndex: 'region',
      key: 'region',
      render: (region: string) => (
        <Tag color="blue">{region}</Tag>
      )
    }
  ];

  const totalCost = filteredBills.reduce((sum, bill) => sum + bill.total_cost, 0);
  const serviceStats = {
    object_storage: filteredBills.filter(b => b.service_type === 'object_storage').reduce((sum, b) => sum + b.total_cost, 0),
    log_service: filteredBills.filter(b => b.service_type === 'log_service').reduce((sum, b) => sum + b.total_cost, 0),
    computing: filteredBills.filter(b => b.service_type === 'computing').reduce((sum, b) => sum + b.total_cost, 0),
    network: filteredBills.filter(b => b.service_type === 'network').reduce((sum, b) => sum + b.total_cost, 0)
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={18}>
            <Title level={2} style={{ margin: 0 }}>
              <FileTextOutlined /> 服务账单
            </Title>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => message.info('导出功能开发中...')}
            >
              导出账单
            </Button>
          </Col>
        </Row>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总费用" value={totalCost} precision={2} prefix="¥" valueStyle={{ color: '#f50' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="对象存储" value={serviceStats.object_storage} precision={2} prefix="¥" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="日志服务" value={serviceStats.log_service} precision={2} prefix="¥" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="故障检测服务" value={serviceStats.computing} precision={2} prefix="¥" valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Search
              placeholder="搜索租户、服务或资源ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={5}>
            <Select
              placeholder="选择租户"
              value={tenantFilter}
              onChange={setTenantFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部租户</Option>
              <Option value="tenant-001">阿里云科技有限公司</Option>
              <Option value="tenant-002">腾讯云计算有限公司</Option>
              <Option value="tenant-003">华为云服务有限公司</Option>
            </Select>
          </Col>
          <Col span={5}>
            <Select
              value={serviceFilter}
              onChange={setServiceFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部服务</Option>
              <Option value="object_storage">对象存储</Option>
              <Option value="log_service">日志服务</Option>
              <Option value="computing">故障检测服务</Option>
              <Option value="network">网络服务</Option>
            </Select>
          </Col>
          <Col span={8}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
        </Row>
      </Card>

      {/* Tabs for service categories */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="全部服务" key="all" />
        <TabPane tab={<span><DatabaseOutlined />对象存储</span>} key="object_storage" />
        <TabPane tab={<span><FileTextOutlined />日志服务</span>} key="log_service" />
        <TabPane tab={<span><CloudOutlined />故障检测服务</span>} key="computing" />
        <TabPane tab={<span><ApiOutlined />网络服务</span>} key="network" />
      </Tabs>

      {/* Bills Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredBills}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="暂无账单数据"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>
    </div>
  );
}

export default BillingList;