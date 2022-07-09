package provider_sdk_go

import (
	"math/rand"
	"testing"
)

func TestCollisionFreeNameWithSeparator(t *testing.T) {
	rnd := rand.New(rand.NewSource(1234))

	// table test
	tests := []struct {
		name string
		want string
		sep  rune
	}{
		{
			name: "test resource",
			want: "test-resource-2bh044",
			sep:  '-',
		},
		{
			name: "Some Test Resource",
			want: "some-test-resource-gziub1",
			sep:  '-',
		},
		{
			name: "Some @Test. Resource",
			want: "some_test_resource_ccv4x7",
			sep:  '_',
		},
	}

	// run tests
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := CollisionFreeNameWithSeparator(test.name, test.sep, rnd); got != test.want {
				t.Errorf("CollisionFreeNameWithSeparator() = %v, want %v", got, test.want)
			}
		})
	}
}
