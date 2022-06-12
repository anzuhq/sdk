package provider_sdk_go

import (
	"fmt"
	"math/rand"
	"time"
)

func randomString(n int, random *rand.Rand) string {
	const alphaNum = "0123456789abcdefghijklmnopqrstuvwxyz"
	var bytes = make([]byte, n)
	for i := range bytes {
		bytes[i] = alphaNum[random.Intn(len(alphaNum))]
	}
	return string(bytes)
}

// CollisionFreeNameWithSeparator appends a unique suffix to the supplied name, using the supplied separator.
func CollisionFreeNameWithSeparator(name string, sep string, rand *rand.Rand) string {
	randomSuffix := randomString(6, rand)
	return fmt.Sprintf("%s%s%s", name, sep, randomSuffix)
}

// CollisionFreeName appends a unique suffix to the supplied name.
// This is used by ResourceInfoProvider.GetResourceName to avoid collisions with other resources, but can also be
// used in other places where a unique name is required.
// The suffix is separated using a hyphen (-), if you need to use a different separator, use CollisionFreeNameWithSeparator.
func CollisionFreeName(name string, rand *rand.Rand) string {
	return CollisionFreeNameWithSeparator(name, "-", rand)
}

// DetermineResourceName returns the input resource name, if set, and defaults to a collision-free version of the resource name otherwise.
func DetermineResourceName(inputResourceName *string, nameProvider ResourceInfoProvider) string {
	if inputResourceName != nil {
		return *inputResourceName
	}
	return nameProvider.GetResourceName()
}

func RandomSeed() *rand.Rand {
	return rand.New(rand.NewSource(time.Now().UnixNano()))
}
