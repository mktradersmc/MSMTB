#include <Object.mqh>

class ITreeNode : public CObject
{
public:
    virtual double GetTreeValue() const = 0;
    virtual string toString() = 0;
};
