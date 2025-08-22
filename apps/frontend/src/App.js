import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Space } from 'antd';
import { 
  ProjectOutlined, 
  FileTextOutlined, 
  SettingOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined 
} from '@ant-design/icons';
import ProjectList from './components/ProjectList.tsx';
import ProjectDetail from './components/ProjectDetail.tsx';
import ProjectLogs from './components/ProjectLogs.tsx';
import Settings from './components/Settings.tsx';
import TaskCostList from './components/TaskCostList.tsx';
import ProjectCreate from './components/ProjectCreate.tsx';
import ProjectEdit from './components/ProjectEdit.tsx';
import TaskCostCreate from './components/TaskCostCreate.tsx';
import BillingList from './components/BillingList.tsx';
import './App.css';

const { useState, useEffect } = React;
const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('projects');

  const menuItems = [
    {
      key: 'projects',
      icon: <ProjectOutlined />,
      label: '项目预算',
      path: '/projects'
    },
    {
      key: 'tasks',
      icon: <UnorderedListOutlined />,
      label: '成本追踪',
      path: '/tasks'
    },
    {
      key: 'billing',
      icon: <FileTextOutlined />,
      label: '服务账单',
      path: '/billing'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      path: '/settings'
    }
  ];

  const onCollapse = (collapsed) => {
    setCollapsed(collapsed);
  };

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
  };

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/projects') || path.startsWith('/project/')) {
      setSelectedKey('projects');
    } else if (path.startsWith('/tasks')) {
      setSelectedKey('tasks');
    } else if (path.startsWith('/billing')) {
      setSelectedKey('billing');
    } else if (path.startsWith('/settings')) {
      setSelectedKey('settings');
    }
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={onCollapse}
          theme="dark"
          width={250}
        >
          <div className="logo aurora-logo">
            <Space align="center" style={{ width: '100%', padding: '16px' }}>
              <ThunderboltOutlined style={{ 
                background: 'linear-gradient(135deg, #00ff88, #0099ff, #9966ff)', 
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '28px',
                filter: 'drop-shadow(0 0 8px rgba(0, 255, 136, 0.5))'
              }} />
              {!collapsed && (
                <Title level={4} style={{ 
                  background: 'linear-gradient(135deg, #00ff88, #0099ff, #9966ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  fontWeight: 'bold',
                  textShadow: '0 0 20px rgba(0, 255, 136, 0.3)'
                }}>
                  Aurora
                </Title>
              )}
            </Space>
          </div>
          
          <Menu
            theme="dark"
            selectedKeys={[selectedKey]}
            mode="inline"
            onClick={handleMenuClick}
          >
            {menuItems.map(item => (
              <Menu.Item key={item.key} icon={item.icon}>
                <Link to={item.path}>{item.label}</Link>
              </Menu.Item>
            ))}
          </Menu>
        </Sider>

        <Layout className="site-layout">
          <Header className="site-layout-background" style={{ padding: '0 16px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              height: '100%'
            }}>
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                AI驱动的成本治理平台
              </Title>
              <Space>
              </Space>
            </div>
          </Header>

          <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/create" element={<ProjectCreate />} />
              <Route path="/tasks" element={<TaskCostList />} />
              <Route path="/tasks/create" element={<TaskCostCreate />} />
              <Route path="/project/:id/edit" element={<ProjectEdit />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/project/:id/logs" element={<ProjectLogs />} />
              <Route path="/billing" element={<BillingList />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Content>

          <Footer style={{ textAlign: 'center' }}>
            AuroraSpend 极光省 ©2025 - Light Up Savings, Not Bills.
          </Footer>
        </Layout>
      </Layout>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;