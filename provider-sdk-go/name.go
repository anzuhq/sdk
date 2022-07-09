package provider_sdk_go

import (
	"fmt"
	"math/rand"
	"time"
	"unicode"
)

func randomString(n int, random *rand.Rand) string {
	const alphaNum = "0123456789abcdefghijklmnopqrstuvwxyz"
	var bytes = make([]byte, n)
	for i := range bytes {
		bytes[i] = alphaNum[random.Intn(len(alphaNum))]
	}
	return string(bytes)
}

func toLowerCase(s string) string {
	// turn each rune to lowercase
	runes := []rune(s)
	for i, r := range runes {
		runes[i] = unicode.ToLower(r)
	}
	return string(runes)
}

func stripSpecialChars(s string, sep rune) string {
	var final []rune
	runes := []rune(s)
	for _, r := range runes {
		// keep alphanumeric
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			final = append(final, r)
			continue
		}

		// keep underscore, hyphen, and period
		if r == '_' || r == '-' {
			final = append(final, r)
			continue
		}

		if unicode.IsSpace(r) {
			final = append(final, sep)
			continue
		}
	}

	return string(final)
}

// CollisionFreeNameWithSeparator appends a unique suffix to the supplied name, using the supplied separator.
// The given name will also be converted to lowercase, and all non-alphanumeric characters will be replaced with the supplied separator.
func CollisionFreeNameWithSeparator(name string, sep rune, rand *rand.Rand) string {
	randomSuffix := randomString(6, rand)

	name = stripSpecialChars(name, sep)
	name = toLowerCase(name)

	return fmt.Sprintf("%s%s%s", name, string(sep), randomSuffix)
}

// CollisionFreeName appends a unique suffix to the supplied name.
// This is used by ResourceInfoProvider.GetResourceName to avoid collisions with other resources, but can also be
// used in other places where a unique name is required.
// The suffix is separated using a hyphen (-), if you need to use a different separator, use CollisionFreeNameWithSeparator.
func CollisionFreeName(name string, rand *rand.Rand) string {
	return CollisionFreeNameWithSeparator(name, '-', rand)
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
