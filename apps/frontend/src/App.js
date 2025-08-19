import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Space } from 'antd';
import { 
  ProjectOutlined, 
  HistoryOutlined, 
  SettingOutlined,
  GithubOutlined,
  UnorderedListOutlined 
} from '@ant-design/icons';
import ProjectList from './components/ProjectList.tsx';
import ProjectDetail from './components/ProjectDetail.tsx';
import Settings from './components/Settings.tsx';
import TaskExecutionList from './components/TaskExecutionList.tsx';
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
      label: '项目',
      path: '/projects'
    },
    {
      key: 'tasks',
      icon: <UnorderedListOutlined />,
      label: '任务',
      path: '/tasks'
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '计费',
      path: '/history'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
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
    } else if (path.startsWith('/history')) {
      setSelectedKey('history');
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
          <div className="logo">
            <Space align="center" style={{ width: '100%', padding: '16px' }}>
              <GithubOutlined style={{ color: '#1890ff', fontSize: '24px' }} />
              {!collapsed && (
                <Title level={4} style={{ color: 'white', margin: 0 }}>
                  NeuroPool
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
                AI驱动的任务平台
              </Title>
              <Space>
              </Space>
            </div>
          </Header>

          <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/tasks" element={<TaskExecutionList />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/history" element={<ProjectList showHistory={true} />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Content>

          <Footer style={{ textAlign: 'center' }}>
            NeuroPool Go-React ©2025 - AI驱动的任务平台
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