#property copyright "Copyright 2023, Your Name"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#include <Expert\ITreeNode.mqh>

enum COLOR { RED, BLACK };

class CRBTreeNode
{
public:
   ITreeNode* data;
   CRBTreeNode *left;
   CRBTreeNode *right;
   CRBTreeNode *parent;
   COLOR COLOR;

   CRBTreeNode(ITreeNode* value) : data(value), left(NULL), right(NULL), parent(NULL), COLOR(RED) {}
};

class CRBTree
{
private:
   CRBTreeNode *root;
   bool m_debug;
   string m_treename;

   void LeftRotate(CRBTreeNode *x);
   void RightRotate(CRBTreeNode *y);
   void InsertFixup(CRBTreeNode *z);
   void DeleteFixup(CRBTreeNode *x, CRBTreeNode *xParent);
   void Transplant(CRBTreeNode *u, CRBTreeNode *v);
   CRBTreeNode* Minimum(CRBTreeNode *x);
   void ClearTree(CRBTreeNode *&n);
   void PrintRecursive(CRBTreeNode *n, int depth);
   bool CheckIntegrityRecursive(CRBTreeNode* node, int &blackHeight, bool &isValid);
   CRBTreeNode* GetFirstNode() const;
   CRBTreeNode* GetNextNode(CRBTreeNode* node) const;
   
public:
   CRBTree(string treename);
   ~CRBTree();
   void Insert(ITreeNode *newNode);
   void Remove(ITreeNode *node);
   ITreeNode* Find(double value);
   ITreeNode* FindNextHigher(double value);
   ITreeNode* FindNextLower(double value);
   void PrintTree();
   CRBTreeNode* FindNode(ITreeNode* node) const;
   ITreeNode* GetFirst() const;
   ITreeNode* GetNext(ITreeNode* current) const;
   int GetNodeCount() const;
   ITreeNode* GetNodeAtIndex(int index);
   bool CheckIntegrity();
   void SetDebug(bool debug);
};

CRBTree::CRBTree(string treename)
{
   root = NULL;
   m_debug = false;
   m_treename = treename;
}

CRBTree::~CRBTree()
{
   ClearTree(root);
}

void CRBTree::SetDebug(bool debug)
{
    m_debug = debug;
}

void CRBTree::Insert(ITreeNode *newNode)
{
   if(newNode == NULL)
   {
      if(m_debug) Print("Error: Attempting to insert NULL node");
      return;
   }

   CRBTreeNode *z = new CRBTreeNode(newNode);
   CRBTreeNode *y = NULL;
   CRBTreeNode *x = root;

   while (x != NULL)
   {
      y = x;
      if(z.data.GetTreeValue() < x.data.GetTreeValue())
         x = x.left;
      else if(z.data.GetTreeValue() > x.data.GetTreeValue())
         x = x.right;
      else
      {
         // Node with same value exists, update it
         if(m_debug) Print("Updating node with value ", DoubleToString(newNode.GetTreeValue(), 5));
         x.data = newNode;
         delete z;
         return;
      }
   }

   z.parent = y;
   if (y == NULL)
      root = z;
   else if (z.data.GetTreeValue() < y.data.GetTreeValue())
      y.left = z;
   else
      y.right = z;

   InsertFixup(z);

   if(m_debug) Print("Inserted new node with value ", DoubleToString(newNode.GetTreeValue(), 5));
}

void CRBTree::InsertFixup(CRBTreeNode *z)
{
    while (z != root && z.parent != NULL && z.parent.COLOR == RED)
    {
        if (z.parent.parent == NULL)
        {
            // Der Großelternknoten sollte nicht NULL sein, wenn wir hier sind.
            // Wenn doch, brechen wir ab, um einen Absturz zu vermeiden.
            break;
        }

        if (z.parent == z.parent.parent.left)
        {
            CRBTreeNode *y = z.parent.parent.right;
            if (y != NULL && y.COLOR == RED)
            {
                z.parent.COLOR = BLACK;
                y.COLOR = BLACK;
                z.parent.parent.COLOR = RED;
                z = z.parent.parent;
            }
            else
            {
                if (z == z.parent.right)
                {
                    z = z.parent;
                    LeftRotate(z);
                }
                if (z.parent != NULL && z.parent.parent != NULL)
                {
                    z.parent.COLOR = BLACK;
                    z.parent.parent.COLOR = RED;
                    RightRotate(z.parent.parent);
                }
            }
        }
        else
        {
            // Symmetrischer Fall
            CRBTreeNode *y = z.parent.parent.left;
            if (y != NULL && y.COLOR == RED)
            {
                z.parent.COLOR = BLACK;
                y.COLOR = BLACK;
                z.parent.parent.COLOR = RED;
                z = z.parent.parent;
            }
            else
            {
                if (z == z.parent.left)
                {
                    z = z.parent;
                    RightRotate(z);
                }
                if (z.parent != NULL && z.parent.parent != NULL)
                {
                    z.parent.COLOR = BLACK;
                    z.parent.parent.COLOR = RED;
                    LeftRotate(z.parent.parent);
                }
            }
        }
    }
    root.COLOR = BLACK;
}

void CRBTree::Remove(ITreeNode *node)
{
    CRBTreeNode *z = FindNode(node);
    if(z == NULL) return;

    CRBTreeNode *y = z;
    CRBTreeNode *x;
    CRBTreeNode *xParent;
    COLOR y_original_COLOR = y.COLOR;

    if (z.left == NULL)
    {
        x = z.right;
        xParent = z.parent;
        Transplant(z, z.right);
    }
    else if (z.right == NULL)
    {
        x = z.left;
        xParent = z.parent;
        Transplant(z, z.left);
    }
    else
    {
        y = Minimum(z.right);
        y_original_COLOR = y.COLOR;
        x = y.right;
        xParent = y;
        if (y.parent == z)
        {
            if(x != NULL) x.parent = y;
            xParent = y;
        }
        else
        {
            xParent = y.parent;
            Transplant(y, y.right);
            y.right = z.right;
            y.right.parent = y;
        }
        Transplant(z, y);
        y.left = z.left;
        y.left.parent = y;
        y.COLOR = z.COLOR;
    }

    delete z;

    if (y_original_COLOR == BLACK)
        DeleteFixup(x, xParent);
}

void CRBTree::DeleteFixup(CRBTreeNode *x, CRBTreeNode *xParent)
{
    while (x != root && (x == NULL || x.COLOR == BLACK))
    {
        if (xParent == NULL) break; // Sicherheitscheck

        if (x == xParent.left)
        {
            CRBTreeNode *w = xParent.right;
            if (w == NULL) break; // Sicherheitscheck

            if (w.COLOR == RED)
            {
                w.COLOR = BLACK;
                xParent.COLOR = RED;
                LeftRotate(xParent);
                w = xParent.right;
                if (w == NULL) break; // Erneuter Sicherheitscheck nach Rotation
            }

            if ((w.left == NULL || w.left.COLOR == BLACK) &&
                (w.right == NULL || w.right.COLOR == BLACK))
            {
                w.COLOR = RED;
                x = xParent;
                xParent = x.parent;
            }
            else
            {
                if (w.right == NULL || w.right.COLOR == BLACK)
                {
                    if (w.left != NULL)
                        w.left.COLOR = BLACK;
                    w.COLOR = RED;
                    RightRotate(w);
                    w = xParent.right;
                    if (w == NULL) break; // Sicherheitscheck nach Rotation
                }

                w.COLOR = xParent.COLOR;
                xParent.COLOR = BLACK;
                if (w.right != NULL)
                    w.right.COLOR = BLACK;
                LeftRotate(xParent);
                x = root;
                xParent = NULL; // x ist jetzt die Wurzel
            }
        }
        else // Symmetrischer Fall
        {
            CRBTreeNode *w = xParent.left;
            if (w == NULL) break; // Sicherheitscheck

            if (w.COLOR == RED)
            {
                w.COLOR = BLACK;
                xParent.COLOR = RED;
                RightRotate(xParent);
                w = xParent.left;
                if (w == NULL) break; // Erneuter Sicherheitscheck nach Rotation
            }

            if ((w.right == NULL || w.right.COLOR == BLACK) &&
                (w.left == NULL || w.left.COLOR == BLACK))
            {
                w.COLOR = RED;
                x = xParent;
                xParent = x.parent;
            }
            else
            {
                if (w.left == NULL || w.left.COLOR == BLACK)
                {
                    if (w.right != NULL)
                        w.right.COLOR = BLACK;
                    w.COLOR = RED;
                    LeftRotate(w);
                    w = xParent.left;
                    if (w == NULL) break; // Sicherheitscheck nach Rotation
                }

                w.COLOR = xParent.COLOR;
                xParent.COLOR = BLACK;
                if (w.left != NULL)
                    w.left.COLOR = BLACK;
                RightRotate(xParent);
                x = root;
                xParent = NULL; // x ist jetzt die Wurzel
            }
        }
    }

    if (x != NULL)
        x.COLOR = BLACK;
}

ITreeNode* CRBTree::Find(double value)
{
   CRBTreeNode* current = root;
   while(current != NULL)
   {
      if(value == current.data.GetTreeValue())
         return current.data;
      else if(value < current.data.GetTreeValue())
         current = current.left;
      else
         current = current.right;
   }
   return NULL;
}

ITreeNode* CRBTree::FindNextHigher(double value)
{
   CRBTreeNode* current = root;
   CRBTreeNode* result = NULL;
   while(current != NULL)
   {
      if(current.data.GetTreeValue() > value)
      {
         result = current;
         current = current.left;
      }
      else
         current = current.right;
   }
   return result != NULL ? result.data : NULL;
}

ITreeNode* CRBTree::FindNextLower(double value)
{
   CRBTreeNode* current = root;
   CRBTreeNode* result = NULL;
   while(current != NULL)
   {
      if(current.data.GetTreeValue() < value)
      {
         result = current;
         current = current.right;
      }
      else
         current = current.left;
   }
   return result != NULL ? result.data : NULL;
}

void CRBTree::PrintTree()
{
   Print("Printing the tree ", m_treename, "...");
   if(root != NULL)
      Print("Root Node: ", DoubleToString(root.data.GetTreeValue(), 5), " COLOR: ", root.COLOR == RED ? "RED" : "BLACK");
   else
      Print("The tree is empty.");
   PrintRecursive(root, 0);
}

CRBTreeNode* CRBTree::FindNode(ITreeNode* node) const
{
    if(node == NULL) return NULL;
    
    CRBTreeNode* current = root;
    while(current != NULL)
    {
        if(node.GetTreeValue() == current.data.GetTreeValue())
        {
            if(node == current.data)
                return current;
            else
                return NULL;
        }
        else if(node.GetTreeValue() < current.data.GetTreeValue())
            current = current.left;
        else
            current = current.right;
    }
    return NULL;
}

bool CRBTree::CheckIntegrity()
{
    bool isValid = true;
    int blackHeight = 0;
    Print("Integrity check of tree ", m_treename);
    if(!CheckIntegrityRecursive(root, blackHeight, isValid))
    {
        Print("Red-Black Tree integrity check failed");
        return false;
    }
    Print("Red-Black Tree integrity check passed");
    return true;
}

void CRBTree::LeftRotate(CRBTreeNode *x)
{
    if(x == NULL || x.right == NULL) return;

    CRBTreeNode *y = x.right;
    x.right = y.left;
    
    if(y.left != NULL)
        y.left.parent = x;
    
    y.parent = x.parent;
    
    if(x.parent == NULL)
    {
        root = y;
    }
    else
    {
        if(x == x.parent.left)
            x.parent.left = y;
        else
            x.parent.right = y;
    }
    
    y.left = x;
    x.parent = y;
}

void CRBTree::RightRotate(CRBTreeNode *y)
{
    if(y == NULL || y.left == NULL) return;

    CRBTreeNode *x = y.left;
    y.left = x.right;
    
    if(x.right != NULL)
        x.right.parent = y;
    
    x.parent = y.parent;
    
    if(y.parent == NULL)
    {
        root = x;
    }
    else
    {
        if(y == y.parent.right)
            y.parent.right = x;
        else
            y.parent.left = x;
    }
    
    x.right = y;
    y.parent = x;
}

void CRBTree::Transplant(CRBTreeNode *u, CRBTreeNode *v)
{
    if(u.parent == NULL)
        root = v;
    else if(u == u.parent.left)
        u.parent.left = v;
    else
        u.parent.right = v;
    if(v != NULL)
        v.parent = u.parent;
}

CRBTreeNode* CRBTree::Minimum(CRBTreeNode *x)
{
    while(x.left != NULL)
        x = x.left;
    return x;
}

void CRBTree::ClearTree(CRBTreeNode *&n)
{
    if(n != NULL)
    {
        ClearTree(n.left);
        ClearTree(n.right);
        delete n;
    }
}

void CRBTree::PrintRecursive(CRBTreeNode *n, int depth)
{
    if(n != NULL)
    {
        string indent = "";
        for(int i = 0; i < depth; i++)
            indent += "  ";
        
        Print(indent, "Node: ", DoubleToString(n.data.GetTreeValue(), 5), 
              " COLOR: ", n.COLOR == RED ? "RED" : "BLACK");
        
        PrintRecursive(n.left, depth + 1);
        PrintRecursive(n.right, depth + 1);
    }
}

bool CRBTree::CheckIntegrityRecursive(CRBTreeNode* node, int &blackHeight, bool &isValid)
{
    if(node == NULL)
    {
        blackHeight = 1;
        return true;
    }

    int leftBlackHeight = 0, rightBlackHeight = 0;
    bool leftValid, rightValid;

    if(node.COLOR == RED && node.parent != NULL && node.parent.COLOR == RED)
    {
        Print("Red-Black Tree property violation: Red node ", DoubleToString(node.data.GetTreeValue(), 5), 
              " has red parent ", DoubleToString(node.parent.data.GetTreeValue(), 5));
        isValid = false;
    }

    leftValid = CheckIntegrityRecursive(node.left, leftBlackHeight, isValid);
    rightValid = CheckIntegrityRecursive(node.right, rightBlackHeight, isValid);

    if(leftBlackHeight != rightBlackHeight)
    {
        Print("Black height mismatch at node ", DoubleToString(node.data.GetTreeValue(), 5));
        isValid = false;
    }

    blackHeight = leftBlackHeight + (node.COLOR == BLACK ? 1 : 0);

    if(node.left != NULL && node.left.data.GetTreeValue() >= node.data.GetTreeValue())
    {
        Print("Binary search tree property violated at node ", DoubleToString(node.data.GetTreeValue(), 5));
        isValid = false;
    }

    if(node.right != NULL && node.right.data.GetTreeValue() <= node.data.GetTreeValue())
    {
        Print("Binary search tree property violated at node ", DoubleToString(node.data.GetTreeValue(), 5));
        isValid = false;
    }

    return leftValid && rightValid && isValid;
}

// Neue private Methoden für CRBTree

CRBTreeNode* CRBTree::GetFirstNode() const
{
    CRBTreeNode* node = root;
    while (node != NULL && node.left != NULL)
    {
        node = node.left;
    }
    return node;
}

CRBTreeNode* CRBTree::GetNextNode(CRBTreeNode* node) const
{
    if (node == NULL)
        return NULL;
    
    if (node.right != NULL)
    {
        node = node.right;
        while (node.left != NULL)
            node = node.left;
        return node;
    }
    
    CRBTreeNode* parent = node.parent;
    while (parent != NULL && node == parent.right)
    {
        node = parent;
        parent = parent.parent;
    }
    return parent;
}

// Neue öffentliche Methoden für CRBTree

ITreeNode* CRBTree::GetFirst() const
{
    CRBTreeNode* node = GetFirstNode();
    return node != NULL ? node.data : NULL;
}

ITreeNode* CRBTree::GetNext(ITreeNode* current) const
{
    if (current == NULL)
        return NULL;
    
    CRBTreeNode* node = FindNode(current);
    if (node == NULL)
        return NULL;
    
    CRBTreeNode* nextNode = GetNextNode(node);
    return nextNode != NULL ? nextNode.data : NULL;
}

int CRBTree::GetNodeCount() const
{
    int count = 0;
    CRBTreeNode* node = GetFirstNode();
    while (node != NULL)
    {
        count++;
        node = GetNextNode(node);
    }
    return count;
}

ITreeNode* CRBTree::GetNodeAtIndex(int index)
{
    if (index < 0)
        return NULL;
    
    CRBTreeNode* node = GetFirstNode();
    for (int i = 0; i < index && node != NULL; i++)
    {
        node = GetNextNode(node);
    }
    
    return node != NULL ? node.data : NULL;
}

// Ende der CRBTree-Klasse


