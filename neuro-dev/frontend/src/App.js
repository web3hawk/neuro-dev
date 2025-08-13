import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Space } from 'antd';
import { 
  ProjectOutlined, 
  HistoryOutlined, 
  SettingOutlined,
  GithubOutlined,
  UnorderedListOutlined 
} from '@ant-design/icons';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import Settings from './components/Settings';
import TaskExecutionList from './components/TaskExecutionList';
import './App.css';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
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
      label: '历史',
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

  return (
    <Router>
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
                  ChatDev
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
                <a href={item.path}>{item.label}</a>
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
                AI驱动的软件开发平台
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
            ChatDev Go-React ©2024 - AI驱动的软件开发平台
          </Footer>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;