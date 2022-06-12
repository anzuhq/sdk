package value

import (
	"encoding/json"
	"github.com/stretchr/testify/assert"
	"testing"
)

// TestParseFieldValue makes sure that embedded (anonymous) types are unmarshaled correctly using the
// custom Unmarshaler interface. By default, duplicate names would be ignored completely, so all Fields from
// object/map values would be ignored.
func TestUnmarshalFieldValue(t *testing.T) {
	var value Value
	str := `{ 
	"kind": "object",
	"fields": [
		{
			"kind": "field",	
			"name": "a",
			"value": {
				"kind": "scalar",
				"serializedValue": "\"hello world\""
			}
		}
	]	
}
	`
	err := json.Unmarshal([]byte(str), &value)
	if err != nil {
		t.Error(err)
		return
	}

	assert.Equal(t, ValueKindObject, value.Kind)
	assert.Equal(t, 1, len(value.ObjectValue.Fields))
	assert.Equal(t, "a", value.ObjectValue.Fields[0].FieldValue.Name)
	assert.Equal(t, ValueKindScalar, value.ObjectValue.Fields[0].FieldValue.Value.Kind)
	assert.Equal(t, "\"hello world\"", value.ObjectValue.Fields[0].FieldValue.Value.ScalarValue.SerializedValue)
}

func TestMarshalFieldValue(t *testing.T) {
	value := &Value{
		ValueBase: ValueBase{
			Kind: ValueKindObject,
		},
		ObjectValue: ObjectValue{
			Fields: []Value{
				{
					ValueBase: ValueBase{
						Kind: ValueKindField,
					},
					FieldValue: FieldValue{
						Name: "a",
						Value: &Value{
							ValueBase: ValueBase{
								Kind: ValueKindScalar,
							},
							ScalarValue: ScalarValue{
								SerializedValue: "\"hello world\"",
								UnderlyingType:  ScalarUnderlyingTypeString,
							},
						},
					},
				},
			},
		},
	}

	str, err := json.Marshal(value)
	if err != nil {
		t.Error(err)
		return
	}

	assert.Equal(t, `{"kind":"object","fields":[{"kind":"field","name":"a","value":{"kind":"scalar","serializedValue":"\"hello world\"","underlyingType":"string"}}]}`, string(str))
}
