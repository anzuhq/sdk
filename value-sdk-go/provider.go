package value

type OutputProvider interface {
	Get() ([]Output, error)
}
