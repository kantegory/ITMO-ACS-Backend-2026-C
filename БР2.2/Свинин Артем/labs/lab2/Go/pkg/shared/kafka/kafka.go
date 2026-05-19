package kafka

import (
	"context"
	"errors"
	"sync"

	kafkago "github.com/segmentio/kafka-go"
)

type Producer interface {
	Publish(ctx context.Context, topic string, key string, value []byte) error
	Close() error
}

type Consumer interface {
	Consume(ctx context.Context, topic string, groupID string, handler func(key string, value []byte) error) error
	Close() error
}

type kafkaProducer struct {
	broker  string
	mu      sync.Mutex
	writers map[string]*kafkago.Writer
}

type kafkaConsumer struct {
	broker  string
	mu      sync.Mutex
	readers []*kafkago.Reader
}

func NewProducer(broker string) Producer {
	return &kafkaProducer{
		broker:  broker,
		writers: make(map[string]*kafkago.Writer),
	}
}

func NewConsumer(broker string) Consumer {
	return &kafkaConsumer{broker: broker}
}

func (p *kafkaProducer) Publish(ctx context.Context, topic string, key string, value []byte) error {
	if topic == "" {
		return errors.New("kafka topic is required")
	}

	writer := p.writerForTopic(topic)
	return writer.WriteMessages(ctx, kafkago.Message{
		Key:   []byte(key),
		Value: value,
	})
}

func (p *kafkaProducer) Close() error {
	p.mu.Lock()
	defer p.mu.Unlock()

	var firstErr error
	for topic, writer := range p.writers {
		if writer == nil {
			continue
		}
		if err := writer.Close(); err != nil && firstErr == nil {
			firstErr = err
		}
		delete(p.writers, topic)
	}

	return firstErr
}

func (p *kafkaProducer) writerForTopic(topic string) *kafkago.Writer {
	p.mu.Lock()
	defer p.mu.Unlock()

	if writer, ok := p.writers[topic]; ok {
		return writer
	}

	writer := &kafkago.Writer{
		Addr:                   kafkago.TCP(p.broker),
		Topic:                  topic,
		Balancer:               &kafkago.LeastBytes{},
		AllowAutoTopicCreation: true,
	}
	p.writers[topic] = writer

	return writer
}

func (c *kafkaConsumer) Consume(ctx context.Context, topic string, groupID string, handler func(key string, value []byte) error) error {
	if topic == "" {
		return errors.New("kafka topic is required")
	}
	if groupID == "" {
		return errors.New("kafka groupID is required")
	}

	reader := kafkago.NewReader(kafkago.ReaderConfig{
		Brokers:  []string{c.broker},
		Topic:    topic,
		GroupID:  groupID,
		MinBytes: 1,
		MaxBytes: 10e6,
	})
	defer c.unregisterReader(reader)
	defer reader.Close()
	c.registerReader(reader)

	for {
		message, err := reader.FetchMessage(ctx)
		if err != nil {
			if errors.Is(err, context.Canceled) || errors.Is(ctx.Err(), context.Canceled) {
				return nil
			}
			return err
		}

		if err := handler(string(message.Key), message.Value); err != nil {
			return err
		}

		if err := reader.CommitMessages(ctx, message); err != nil {
			if errors.Is(err, context.Canceled) || errors.Is(ctx.Err(), context.Canceled) {
				return nil
			}
			return err
		}
	}
}

func (c *kafkaConsumer) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	var firstErr error
	for _, reader := range c.readers {
		if reader == nil {
			continue
		}
		if err := reader.Close(); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	c.readers = nil

	return firstErr
}

func (c *kafkaConsumer) registerReader(reader *kafkago.Reader) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.readers = append(c.readers, reader)
}

func (c *kafkaConsumer) unregisterReader(reader *kafkago.Reader) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for i, item := range c.readers {
		if item == reader {
			c.readers = append(c.readers[:i], c.readers[i+1:]...)
			return
		}
	}
}
