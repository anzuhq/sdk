package service

import (
	"os"
	"testing"
)

func TestNewClient(t *testing.T) {
	testHost := "some-host"
	testToken := "some-token"

	err := os.Setenv("ANZU_API_HOST", testHost)
	if err != nil {
		return
	}

	err = os.Setenv("ANZU_SERVICE_TOKEN", testToken)
	if err != nil {
		return
	}

	c, err := NewClient()
	if err != nil {
		t.Errorf("NewClient() error: %v", err)
	}

	underlying, ok := c.(*client)
	if !ok {
		t.Errorf("NewClient() returned a non-*client* type")
	}

	if underlying.apiHost != testHost || underlying.serviceToken != testToken {
		t.Errorf("NewClient() error: apiHost or serviceToken is empty")
	}

	c, err = NewClient(WithApiHost("another-host"), WithServiceToken("another-token"))
	if err != nil {
		t.Errorf("NewClient() error: %v", err)
	}

	underlying, ok = c.(*client)
	if !ok {
		t.Errorf("NewClient() returned a non-*client* type")
	}

	if underlying.apiHost != "another-host" || underlying.serviceToken != "another-token" {
		t.Errorf("NewClient() error: apiHost or serviceToken is empty")
	}
}
