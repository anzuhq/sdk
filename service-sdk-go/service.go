package service

import (
	"context"
	"fmt"
	"github.com/anzuhq/sdk/value"
	"net/http"
)

type GetServiceConnectionResp struct {
	Id       string `json:"id"`
	Name     string `json:"name"`
	Resource *struct {
		Id      string         `json:"id"`
		Name    string         `json:"name"`
		Inputs  []value.Input  `json:"inputs"`
		Outputs []value.Output `json:"outputs"`
	} `json:"resource"`
	Inputs []value.Input `json:"inputs"`
}

type GetCurrentServiceResp struct {
	Id          string `json:"id"`
	Name        string `json:"name"`
	Environment struct {
		Id        string `json:"id"`
		Name      string `json:"name"`
		VariantId string `json:"variantId"`
	} `json:"environment"`
	Inputs []value.Input `json:"inputs"`
}

func (c *client) GetCurrentService(ctx context.Context) (*GetCurrentServiceResp, error) {
	var resp GetCurrentServiceResp
	err := c.sendRequest(ctx, http.MethodGet, "/services/current", nil, &resp)
	if err != nil {
		return nil, fmt.Errorf("failed to get current service: %w", err)
	}

	return &resp, nil
}

func (c *client) GetConnectionDetails(ctx context.Context, connectionId string) (*GetServiceConnectionResp, error) {
	var resp GetServiceConnectionResp
	err := c.sendRequest(ctx, http.MethodGet, fmt.Sprintf("/services/current/connections/%s", connectionId), nil, &resp)
	if err != nil {
		return nil, fmt.Errorf("failed to get connection details: %w", err)
	}

	return &resp, nil
}
