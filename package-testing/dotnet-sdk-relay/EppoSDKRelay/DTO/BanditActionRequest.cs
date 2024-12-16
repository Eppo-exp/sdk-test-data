using eppo_sdk.dto.bandit;
using EppoSDKRelay.util;

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
        return Actions.ToDictionary(action => action.ActionKey,
                                    action => ContextAttributes.FromNullableAttributes(action.ActionKey, Values.ConvertJsonValuesToPrimitives(action.CategoricalAttributes), Values.ConvertJsonValuesToPrimitives(action.NumericAttributes)));
    }
}
