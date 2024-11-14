namespace EppoSDKRelay.DTO;

using System.Text.Json;

public class AttributeSet
{
    public Dictionary<string, object?> NumericAttributes { get; set; }
    public Dictionary<string, object?> CategoricalAttributes { get; set; }

    public Dictionary<string, object?> AttributeDictionary
    {
        get => new Dictionary<string, object?>[] { NumericAttributes, CategoricalAttributes }.SelectMany(dict => dict)
                         .ToDictionary(pair => pair.Key, pair => pair.Value);
    }

    public Dictionary<string, string?> CategoricalAttributesAsStrings
    {
        get
        {
            return CategoricalAttributes.ToDictionary(kvp => kvp.Key, kvp => Convert.ToString(kvp.Value));
        }
    }
    public Dictionary<string, object?> NumericAttributesAsNumbers => NumericAttributes
                .Where(kvp =>
                    (kvp.Value is JsonElement jsonElement) && jsonElement.ValueKind == JsonValueKind.Number)
                .ToDictionary(kvp => kvp.Key, static kvp => (object?)((JsonElement)kvp.Value).GetDouble());

}
