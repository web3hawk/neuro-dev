package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

// Structures map the YAML file
// settings:
//   application:
//   logger:
//   jwt:
//   database:

type Settings struct {
	Application Application `yaml:"application"`
	Logger      Logger      `yaml:"logger"`
	JWT         JWT         `yaml:"jwt"`
	Database    Database    `yaml:"database"`
	LLM         LLM         `yaml:"llm"`
}

type Application struct {
	Mode         string `yaml:"mode"`
	Host         string `yaml:"host"`
	Name         string `yaml:"name"`
	Port         int    `yaml:"port"`
	ReadTimeout  int    `yaml:"readtimeout"`
	WriteTimeout int    `yaml:"writertimeout"`
	EnableDP     bool   `yaml:"enabledp"`
}

type Logger struct {
	Path     string `yaml:"path"`
	Stdout   string `yaml:"stdout"`
	Level    string `yaml:"level"`
	EnableDB bool   `yaml:"enableddb"`
}

type JWT struct {
	Secret  string `yaml:"secret"`
	Timeout int    `yaml:"timeout"`
}

type Database struct {
	Driver   string `yaml:"driver"`
	Source   string `yaml:"source"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
}

type LLM struct {
	Provider string `yaml:"provider"`
	ApiKey   string `yaml:"api_key"`
	BaseURL  string `yaml:"base_url"`
	Model    string `yaml:"model"`
	Timeout  int    `yaml:"timeout"`
}

type Root struct {
	Settings Settings `yaml:"settings"`
}

// Load reads YAML configuration from the default path ./config/settings.yml unless overridden by NEURO_SETTINGS_PATH
func Load() (*Settings, error) {
	path := os.Getenv("NEURO_SETTINGS_PATH")
	if path == "" {
		path = "./config/settings.yml"
	}
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read settings.yml failed: %w", err)
	}
	var r Root
	if err := yaml.Unmarshal(b, &r); err != nil {
		return nil, fmt.Errorf("unmarshal settings.yml failed: %w", err)
	}
	return &r.Settings, nil
}
