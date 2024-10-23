

using System.Text.Json;
using eppo_sdk.dto.bandit;

namespace EppoSDKRelay.DTO;


public class BanditActionRequest
{
    public string Flag { get; set; }
    public string DefaultValue { get; set; }
    public string SubjectKey { get; set; }
    public SubjectAttributes SubjectAttributes { get; set; }
    public List<Action> Actions { get; set; }

    public ContextAttributes GetSubjectContext()
    {
        return ContextAttributes.FromNullableAttributes(SubjectKey,
                                                        SubjectAttributes.CategoricalAttributesAsStrings,
                                                        SubjectAttributes.NumericAttributes);
    }

    public IDictionary<string, ContextAttributes> GetActionContextDict()
    {
        // The Eppo client API doesn't actually allow for non string-typed attributes to be explictly passed to the client.
        // We get around these "dynamic" typing tests, not by skipping them like other languages, but by convering the data

        return Actions.ToDictionary(action => action.ActionKey,
                                    action => ContextAttributes.FromNullableAttributes(action.ActionKey, action.CategoricalAttributesAsStrings, action.NumericAttributesAsNumbers));
    }
}

public class SubjectAttributes
{
    public Dictionary<string, object?> NumericAttributes { get; set; }
    public Dictionary<string, object?> CategoricalAttributes { get; set; }

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

public class Action : SubjectAttributes
{
    public string ActionKey { get; set; }
}
