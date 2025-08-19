package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/rs/cors"
	"neuro-dev/controllers"
)

func main() {
	// Allow overriding settings path from env if running from different working dir
	if os.Getenv("NEURO_SETTINGS_PATH") == "" {
		if _, err := os.Stat("./config/settings.yml"); err != nil {
			// try default relative to apps/backend
			_ = os.Setenv("NEURO_SETTINGS_PATH", "D:/code-work/go/work-space/neuro-dev/apps/backend/config/settings.yml")
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	s := controllers.NewServer()

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})
	handler := c.Handler(s.Router)

	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
