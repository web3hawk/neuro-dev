package controllers

import "net/http"

// Config-related handlers
func (s *Server) getCompanies(w http.ResponseWriter, r *http.Request) {
	s.sendResponse(w, []string{"Default", "Art", "Human"})
}

func (s *Server) getPhases(w http.ResponseWriter, r *http.Request) {
	s.sendResponse(w, []string{
		"DemandAnalysis",
		"LanguageChoose",
		"Coding",
		"ArtDesign",
		"ArtIntegration",
		"CodeComplete",
		"CodeReviewComment",
		"CodeReviewModification",
		"TestErrorSummary",
		"TestModification",
	})
}

func (s *Server) getRoles(w http.ResponseWriter, r *http.Request) {
	s.sendResponse(w, []string{
		"Chief Executive Officer",
		"Chief Product Officer",
		"Chief Technology Officer",
		"Programmer",
		"Code Reviewer",
		"Software Test Engineer",
		"Chief Creative Officer",
	})
}

func (s *Server) getModels(w http.ResponseWriter, r *http.Request) {
	s.sendResponse(w, []string{"GPT_3_5_TURBO", "GPT_4", "GPT_4_TURBO", "GPT_4O", "GPT_4O_MINI"})
}
