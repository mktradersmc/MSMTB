#ifndef STRATEGY_MANAGER_MQH
#define STRATEGY_MANAGER_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\StrategyUIController.mqh>
#include <Expert\StrategyExecutor.mqh>
#include <Expert\Globals.mqh>
#include <Expert\Strategy.mqh>
#include <Expert\ConfigurationManager.mqh>

class CStrategyManager : public CObject
{
private:
   static CStrategyManager* m_instance;
   CStrategyUIController* m_uiController;
   CStrategyExecutor* m_executor;
   int m_activeMacroIndex;
   CArrayObj* m_strategies;

   CStrategyManager(); // Private constructor

public:
   static CStrategyManager* GetInstance();
   void SetStrategyExecutor(CStrategyExecutor* executor);
   ~CStrategyManager();
   
   CStrategyUIController* GetUIController();
   void InitializeStrategies();
   void CreateButtons();
   void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam);
   void ActivateMacroStrategy(string macroName);
   CStrategy* FindStrategyByName(string strategyName);
   void ActivateMacroStrategy(int index);
   void DeactivateMacroStrategy();
   void UpdateStrategyLabels();
};

#endif

// Implementation

CStrategyManager* CStrategyManager::m_instance = NULL;

CStrategyManager::CStrategyManager() : m_executor(NULL), m_activeMacroIndex(-1) 
{
   m_uiController = new CStrategyUIController();
}

CStrategyManager* CStrategyManager::GetInstance()
{
   if (m_instance == NULL)
   {
      m_instance = new CStrategyManager();
   }
   return m_instance;
}

void CStrategyManager::SetStrategyExecutor(CStrategyExecutor* executor)
{
   m_executor = executor;
}

CStrategyManager::~CStrategyManager()
{
   delete m_uiController;
}

CStrategyUIController* CStrategyManager::GetUIController() 
{
   return m_uiController;
}

void CStrategyManager::InitializeMacros()
{  
   m_strategies = CConfigurationManager::GetInstance().GetStrategies();
   
   for(int i = 0; i < m_strategies.Total(); i++)
   {
      CStrategy* strategy = m_strategies.At(i);
      if(strategy.Type == REGULAR && strategy.IsActive)
      {            
         m_executor.AddStrategy(strategy);
         Print("Active regular strategy added to executor: ", strategy.Name);
      }
   }
   
   CreateButtons();
}

void CStrategyManager::CreateButtons()
{
   int macroCount = 0;
   for(int i = 0; i < m_strategies.Total(); i++)
   {
      CStrategy* strategy = m_strategies.At(i);
      if(strategy.Type == MACRO)
      {
         m_uiController.CreateButton(strategy.Name, strategy.Label, macroCount);
         macroCount++;
      }
   }
   m_uiController.CreateCloseButton();
}

void CStrategyManager::OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
   if(id == CHARTEVENT_OBJECT_CLICK)
   {
      if(sparam == "CloseButton")
      {
         DeactivateMacroStrategy();
         m_uiController.HideUI();
      }
      else
      {
         for(int i = 0; i < m_strategies.Total(); i++)
         {
            CStrategy* strategy = m_strategies.At(i);
            if(strategy.Type == MACRO && strategy.Name == sparam)
            {
               ActivateMacroStrategy(i);
               m_uiController.ShowUI();
               break;
            }
         }
      }
   }
}

void CStrategyManager::ActivateMacroStrategy(string macroName)
{
   for (int i=0; i<m_strategies.Total();i++)
   {
      CStrategy* strategy = m_strategies.At(i);
      if (strategy.Name == macroName)
         ActivateMacroStrategy(i);
   }      
}

CStrategy* CStrategyManager::FindStrategyByName(string strategyName)
{
   for (int i=0; i<m_strategies.Total();i++)
   {
      CStrategy* strategy = m_strategies.At(i);
      if (strategy.Name == strategyName)
         return strategy;
   }      
   
   return NULL;
}

void CStrategyManager::ActivateMacroStrategy(int index)
{
   if(m_activeMacroIndex != -1)
   {
      DeactivateMacroStrategy();
   }

   CStrategy* strategy = m_strategies.At(index);
   if(strategy.Type == MACRO)
   {
      m_activeMacroIndex = index;
      strategy.IsActive = true;
      m_executor.AddStrategy(strategy);
      m_uiController.CreateLabels(strategy);
   }
}

void CStrategyManager::DeactivateMacroStrategy()
{
   if(m_activeMacroIndex != -1)
   {
      CStrategy* strategy = m_strategies.At(m_activeMacroIndex);
      strategy.IsActive = false;
      m_executor.RemoveStrategy(strategy);
      m_uiController.ClearLabels();
      m_activeMacroIndex = -1;
   }
}

void CStrategyManager::UpdateStrategyLabels()
{      
   CStrategy* strategy = m_strategies.At(m_activeMacroIndex);
   if (strategy != NULL)
   {
      m_uiController.UpdateLabels(strategy);
   }
}


