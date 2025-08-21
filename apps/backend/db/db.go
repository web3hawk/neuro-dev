package db

import (
	"errors"
	"fmt"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"neuro-dev/config"
)

var DB *gorm.DB

// Init initializes the global DB handle using settings
func Init(settings *config.Settings) (*gorm.DB, error) {
	if settings == nil {
		return nil, errors.New("nil settings")
	}
	d := strings.ToLower(strings.TrimSpace(settings.Database.Driver))
	if d != "postgres" {
		return nil, fmt.Errorf("unsupported driver: %s (only postgres is supported)", settings.Database.Driver)
	}
	dsn, err := buildPostgresDSN(settings)
	if err != nil {
		return nil, err
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect database: %w", err)
	}
	DB = db
	return db, nil
}

// buildPostgresDSN builds a postgres DSN from settings
// It supports source in the format: tcp(host:port)/dbname or host:port/dbname.
func buildPostgresDSN(s *config.Settings) (string, error) {
	user := s.Database.User
	password := s.Database.Password
	source := strings.TrimSpace(s.Database.Source)
	var host, port, dbname string

	// Remove optional tcp(...) wrapper
	if strings.HasPrefix(source, "tcp(") && strings.Contains(source, ")/") {
		// tcp(host:port)/dbname
		leftRight := strings.SplitN(source, ")/", 2)
		inner := strings.TrimPrefix(leftRight[0], "tcp(")
		hostPort := inner
		dbname = leftRight[1]
		// split host:port
		if hp := strings.Split(hostPort, ":"); len(hp) == 2 {
			host = hp[0]
			port = hp[1]
		} else {
			host = hostPort
			port = "5432"
		}
	} else if strings.Contains(source, "/") {
		// host:port/dbname
		parts := strings.SplitN(source, "/", 2)
		hostPort := parts[0]
		dbname = parts[1]
		if hp := strings.Split(hostPort, ":"); len(hp) == 2 {
			host = hp[0]
			port = hp[1]
		} else {
			host = hostPort
			port = "5432"
		}
	} else {
		return "", fmt.Errorf("invalid postgres source: %s", source)
	}

	if dbname == "" {
		return "", fmt.Errorf("missing dbname in source: %s", source)
	}
	if host == "" {
		host = "127.0.0.1"
	}
	if port == "" {
		port = "5432"
	}

	// Compose DSN
	// sslmode disabled by default; can be extended later
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)
	return dsn, nil
}
