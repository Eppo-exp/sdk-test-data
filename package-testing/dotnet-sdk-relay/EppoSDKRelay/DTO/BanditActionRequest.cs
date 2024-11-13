using System.Text.Json;
using eppo_sdk.dto.bandit;

namespace EppoSDKRelay.DTO;

public class BanditActionRequest
{
    public string Flag { get; set; }
    public string DefaultValue { get; set; }
    public string SubjectKey { get; set; }
    public AttributeSet SubjectAttributes { get; set; }
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
