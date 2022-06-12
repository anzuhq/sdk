package provider_sdk_go

import (
	"context"
	"flag"
	"github.com/sirupsen/logrus"
	"os"
	"os/signal"
	"strconv"
	"syscall"
)

func Start(provider *Provider) error {
	ctx, cancel := context.WithCancel(context.Background())
	logger := logrus.New()
	logger.SetLevel(logrus.TraceLevel)

	port := flag.Int("port", 0, "port to serve on")
	flag.Parse()

	parsedPort, _ := strconv.Atoi(os.Getenv("PORT"))
	if parsedPort != 0 {
		*port = parsedPort
	}

	if *port == 0 {
		logger.Fatal("port flag must be provided with non-zero value")
	}

	baseLogger := logger.WithContext(ctx).WithField("service", "provider")

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		sig := <-signalChan
		logger.WithFields(logrus.Fields{
			"signal": sig,
		}).Traceln("received signal, shutting down")
		cancel()
	}()

	err := serve(ctx, baseLogger, provider, *port)
	if err != nil {
		return err
	}

	return nil
}
