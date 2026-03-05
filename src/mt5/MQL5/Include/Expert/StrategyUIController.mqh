//+------------------------------------------------------------------+
//|                                         CStrategyUIController.mqh |
//|                                  Copyright 2023, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef STRATGY_UI_CONTROLLER_MQH
#define STRATGY_UI_CONTROLLER_MQH

#include <Controls\Button.mqh>
#include <Controls\Label.mqh>
#include <Expert\Strategy.mqh>

#define MARGIN_TOP 30
#define MARGIN_LEFT 30
#define BUTTON_SPACING 30
#define BUTTON_HEIGHT 40
#define CHARACTER_WIDTH 18
#define MIN_BUTTON_WIDTH 100
#define BUTTON_LABEL_SPACING 20
#define LABEL_SPACING 35
#define LABEL_HEIGHT 20
#define LABEL_PADDING 20
#define LABEL_WIDTH_MULTIPLIER 1.2
#define STEP_INDENT 40
#define BACKGROUND_PADDING 15
#define BORDER_WIDTH 2
#define EXTRA_INDENT 10

class CStrategyUIController : public CObject
{
private:
   CButton* m_buttons[];
   CLabel* m_labels[];
   string m_backgroundName;
   string m_borderName;
   int m_buttonCount;
   color m_labelColor;
   color m_completedColor;
   color m_backgroundColor;
   color m_borderColor;
   bool m_isUIVisible;
   bool m_isHintMode;
   
   CLabel* m_statusLabel;
   string m_statusBackgroundName;
   color m_activeColor;
   color m_inactiveColor;   
   int m_statusLabelWidth;

   double ColorBrightness(color clr)
   {
      uint argb = ColorToARGB(clr);
      uchar r = (uchar)((argb >> 16) & 0xFF);
      uchar g = (uchar)((argb >> 8) & 0xFF);
      uchar b = (uchar)(argb & 0xFF);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
   }

   int CalculateLabelWidth(string text)
   {
      return (int)((StringLen(text) * CHARACTER_WIDTH + LABEL_PADDING * 2));
   }

   void SetupLabel(CLabel* &label, string name, string text, int x, int y, color textColor)
   {
      int labelWidth = CalculateLabelWidth(text);
      
      if(label == NULL)
      {
         label = new CLabel();
         label.Create(0, name, 0, x, y, labelWidth, LABEL_HEIGHT);
      }
      else
      {
         label.Width(labelWidth);
         ObjectSetInteger(0, label.Name(), OBJPROP_XDISTANCE, x);
         ObjectSetInteger(0, label.Name(), OBJPROP_YDISTANCE, y);
      }
      
      label.Text(text);
      label.Color(textColor);
      label.FontSize(10);
   }

   void UpdateBackgroundSize()
   {
      int minX = INT_MAX;
      int maxX = 0;
      int minY = INT_MAX;
      int maxY = 0;
      
      // Berücksichtige alle Labels
      for(int i = 0; i < ArraySize(m_labels); i++)
      {
         if(m_labels[i] != NULL)
         {
            int x = (int)ObjectGetInteger(0, m_labels[i].Name(), OBJPROP_XDISTANCE);
            int y = (int)ObjectGetInteger(0, m_labels[i].Name(), OBJPROP_YDISTANCE);
            int width = m_labels[i].Width();
            
            minX = MathMin(minX, x);
            maxX = MathMax(maxX, x + width);
            minY = MathMin(minY, y);
            maxY = MathMax(maxY, y + LABEL_HEIGHT);
         }
      }
 
       // Füge Padding hinzu
      int x1 = minX - BACKGROUND_PADDING - BORDER_WIDTH - EXTRA_INDENT;
      int y1 = minY - BACKGROUND_PADDING - BORDER_WIDTH;
      int x2 = maxX + BACKGROUND_PADDING + BORDER_WIDTH;
      int y2 = maxY + BACKGROUND_PADDING + BORDER_WIDTH + LABEL_SPACING;
      
      // Setze die Größe und Position des Rahmens und des Hintergrunds
      ObjectSetInteger(0, m_borderName, OBJPROP_XDISTANCE, x1);
      ObjectSetInteger(0, m_borderName, OBJPROP_YDISTANCE, y1);
      ObjectSetInteger(0, m_borderName, OBJPROP_XSIZE, x2 - x1);
      ObjectSetInteger(0, m_borderName, OBJPROP_YSIZE, y2 - y1);
      
      ObjectSetInteger(0, m_backgroundName, OBJPROP_XDISTANCE, x1 + BORDER_WIDTH);
      ObjectSetInteger(0, m_backgroundName, OBJPROP_YDISTANCE, y1 + BORDER_WIDTH);
      ObjectSetInteger(0, m_backgroundName, OBJPROP_XSIZE, x2 - x1 - 2*BORDER_WIDTH);
      ObjectSetInteger(0, m_backgroundName, OBJPROP_YSIZE, y2 - y1 - 2*BORDER_WIDTH);
   }
   
   void CreateBackground(string name, int x, int y, int width, int height)
   {
      if(ObjectFind(0, name) >= 0)
      {
         ObjectDelete(0, name);
      }
   
      if(!ObjectCreate(0, name, OBJ_RECTANGLE_LABEL, 0, 0, 0))
      {
         Print("Failed to create ", name, " object. Error code: ", GetLastError());
         return;
      }
      
      ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
      ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
      ObjectSetInteger(0, name, OBJPROP_XSIZE, width);
      ObjectSetInteger(0, name, OBJPROP_YSIZE, height);
      ObjectSetInteger(0, name, OBJPROP_BGCOLOR, m_backgroundColor);
      ObjectSetInteger(0, name, OBJPROP_BORDER_TYPE, BORDER_FLAT);
      ObjectSetInteger(0, name, OBJPROP_BORDER_COLOR, m_borderColor);
      ObjectSetInteger(0, name, OBJPROP_WIDTH, BORDER_WIDTH);
      ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, name, OBJPROP_ZORDER, 0);
   }

   void CreateStatusLabel()
   {
      if(m_statusLabel != NULL)
      {
         delete m_statusLabel;
      }
      
      // Calculate the position based on the Close Button
      int closeButtonX = 0;
      int closeButtonY = 0;
      int closeButtonWidth = 0;
      int closeButtonHeight = 0;
      
      if(m_buttonCount > 0)
      {
         CButton* closeButton = m_buttons[m_buttonCount - 1];  // Assuming Close Button is the last one
         closeButtonX = (int)ObjectGetInteger(0, closeButton.Name(), OBJPROP_XDISTANCE);
         closeButtonY = (int)ObjectGetInteger(0, closeButton.Name(), OBJPROP_YDISTANCE);
         closeButtonWidth = closeButton.Width();
         closeButtonHeight = closeButton.Height();
      }
      else
      {
         // Fallback if there's no Close Button
         closeButtonX = MARGIN_LEFT;
         closeButtonY = MARGIN_TOP;
         closeButtonWidth = 50;  // Default width
         closeButtonHeight = BUTTON_HEIGHT;
      }
      
      // Calculate the width needed for the label
      string longestText = "Trading Inaktiv"; // This is longer than "Trading Aktiv"
      m_statusLabelWidth = (int)(StringLen(longestText) * 12); // Approximate width based on text length
      m_statusLabelWidth += 2 * BACKGROUND_PADDING; // Add padding
      
      int x = closeButtonX + closeButtonWidth + BUTTON_SPACING;
      int y = closeButtonY;
      
      m_statusBackgroundName = "StatusBackground";
      CreateBackground(m_statusBackgroundName, x , y , m_statusLabelWidth , closeButtonHeight);

      m_statusLabel = new CLabel();
      m_statusLabel.Create(0, "StatusLabel", 0, x+10, y, m_statusLabelWidth, closeButtonHeight);
      m_statusLabel.FontSize(10);
      m_statusLabel.Color(m_inactiveColor);
      m_statusLabel.Text("Trading Inaktiv");
      
      ShowStatusLabel(); // Ensure the status label is visible from the start
   }

   void ShowStatusLabel()
   {
      if(m_statusLabel != NULL)
         m_statusLabel.Show();
      ObjectSetInteger(0, m_statusBackgroundName, OBJPROP_TIMEFRAMES, OBJ_ALL_PERIODS);
      ChartRedraw(0);
   }

public:
   CStrategyUIController() : m_buttonCount(0), m_isUIVisible(false), m_isHintMode(false)
   {
      m_labelColor = clrBlack;
      m_completedColor = clrGreen;
      m_backgroundColor = C'255,255,200'; // Blass-mattes Gelb
      m_borderColor = clrGray;
      m_backgroundName = "StrategyBackground";
      m_borderName = "StrategyBorder";
      m_activeColor = clrGreen;
      m_inactiveColor = clrRed;
      m_statusBackgroundName = "StatusBackground";
   }
   
   ~CStrategyUIController()
   {
      for(int i = 0; i < m_buttonCount; i++)
      {
         delete m_buttons[i];
      }
      ClearLabels();
      ObjectDelete(0, m_backgroundName);
      ObjectDelete(0, m_borderName);
      if (m_statusLabel != NULL)
         delete m_statusLabel;
      ObjectDelete(0, m_statusBackgroundName);
   }

   void CreateButton(string name, string label, int index)
   {
      CButton* button = new CButton();
      
      int buttonWidth = MathMax(StringLen(label) * CHARACTER_WIDTH, MIN_BUTTON_WIDTH);
      
      int x1 = MARGIN_LEFT;
      for(int i = 0; i < index; i++)
      {
         x1 += m_buttons[i].Width() + BUTTON_SPACING;
      }
      
      int y1 = MARGIN_TOP;
      int x2 = x1 + buttonWidth;
      int y2 = y1 + BUTTON_HEIGHT;
      
      button.Create(0, name, 0, x1, y1, x2, y2);
      button.Text(label);
      
      ArrayResize(m_buttons, m_buttonCount + 1);
      m_buttons[m_buttonCount] = button;
      m_buttonCount++;
   }

   void CreateCloseButton()
   {
      CreateButton("CloseButton", "X", m_buttonCount);
      CreateStatusLabel();
   }

   void CreateLabels(CStrategy* strategy)
   {
      if(m_isHintMode) return;
      
      ClearLabels();
      
      int labelCount = strategy.LongStepCount() + strategy.ShortStepCount();
      if (strategy.LongStepCount() > 0)
         labelCount++;
      if (strategy.ShortStepCount() > 0)
         labelCount++;
         
      if(labelCount == 0)
      {
         HideUI();
         return;
      }
      
      CreateBackground(m_borderName, 
                       MARGIN_LEFT, 
                       MARGIN_TOP + BUTTON_HEIGHT + BUTTON_LABEL_SPACING, 
                       100, 100);  // Anfangsgröße, wird später angepasst
      
      ArrayResize(m_labels, labelCount);
      
      int y = MARGIN_TOP + BUTTON_HEIGHT + BUTTON_LABEL_SPACING + BACKGROUND_PADDING + BORDER_WIDTH;
      int labelIndex = 0;
      
      int textIndent = MARGIN_LEFT + BACKGROUND_PADDING + BORDER_WIDTH + EXTRA_INDENT;
      
      if(strategy.HasLongStrategy())
      {
         SetupLabel(m_labels[labelIndex], "Long_Strategy", "Long Strategie:", textIndent, y, m_labelColor);
         labelIndex++;
         y += LABEL_SPACING;
         
         for(int i = 0; i < strategy.LongStepCount(); i++)
         {
            CStrategyStep* step = strategy.GetLongStep(i);
            string description = step.GetDescription();
            if(description == "") description = "Schritt " + IntegerToString(i+1);
            
            SetupLabel(m_labels[labelIndex], "Long_" + IntegerToString(i) + "_Desc", description + " (offen)", textIndent + STEP_INDENT, y, m_labelColor);
            labelIndex++;
            y += LABEL_SPACING;            
         }
      }
      
      if(strategy.HasShortStrategy())
      {
         SetupLabel(m_labels[labelIndex], "Short_Strategy", "Short Strategie:", textIndent, y, m_labelColor);
         labelIndex++;
         y += LABEL_SPACING;
         
         for(int i = 0; i < strategy.ShortStepCount(); i++)
         {
            CStrategyStep* step = strategy.GetShortStep(i);
            string description = step.GetDescription();
            if(description == "") description = "Schritt " + IntegerToString(i+1);
            
            SetupLabel(m_labels[labelIndex], "Short_" + IntegerToString(i) + "_Desc", description + " (offen)", textIndent + STEP_INDENT, y, m_labelColor);
            labelIndex++;
            y += LABEL_SPACING;            
         }
      }
      
      ArrayResize(m_labels, labelIndex);
      UpdateBackgroundSize();
      ShowUI();
   }
   
   void UpdateTradingStatus(bool isActive)
   {
      if(m_statusLabel == NULL)
      {
         CreateStatusLabel();
      }
      
      string statusText = isActive ? "Trading Aktiv" : "Trading Inaktiv";
      m_statusLabel.Text(statusText);
      m_statusLabel.Color(isActive ? m_activeColor : m_inactiveColor);
      
      ShowStatusLabel(); // Ensure the status label is visible after updating
   }
   
   void ClearLabels()
   {
      for(int i = 0; i < ArraySize(m_labels); i++)
      {
         delete m_labels[i];
         m_labels[i] = NULL;
      }
      ArrayFree(m_labels);
   }

   void UpdateLabels(CStrategy* strategy)
   {
      if(strategy == NULL)
         return;

      int labelIndex = 0;

      if(strategy.HasLongStrategy())
      {
         labelIndex++; // Überspringen des "Long Strategie:" Labels
         for(int i = 0; i < strategy.LongStepCount(); i++)
         {
            CStrategyStep* step = strategy.GetLongStep(i);            
            UpdateStepLabel(labelIndex, step, step.IsCompleted(), true);
            labelIndex++;
         }
      }

      if(strategy.HasShortStrategy())
      {
         labelIndex++; // Überspringen des "Short Strategie:" Labels
         for(int i = 0; i < strategy.ShortStepCount(); i++)
         {
            CStrategyStep* step = strategy.GetShortStep(i);
            UpdateStepLabel(labelIndex, step, step.IsCompleted(), false);
            labelIndex++;
         }
      }

      UpdateBackgroundSize();
      ChartRedraw(0);
   }
   
   void UpdateStepLabel(int labelIndex, CStrategyStep* step, bool isCompleted, bool isLong)
   {
      if(labelIndex < 0 || labelIndex >= ArraySize(m_labels) || step == NULL)
         return;

      string description = step.GetDescription();
      if(description == "") 
         description = "Schritt " + IntegerToString(step.GetStepNumber());

      string status = isCompleted ? " (erfüllt)" : " (offen)";
      string newText = description + status;

      color textColor = isCompleted ? m_completedColor : m_labelColor;
      
      string strategyType = isLong ? "Long" : "Short";
      string descLabelName = strategyType + "_" + IntegerToString(step.GetStepNumber() - 1) + "_Desc";

      SetupLabel(m_labels[labelIndex], descLabelName, newText, 
                 (int)ObjectGetInteger(0, m_labels[labelIndex].Name(), OBJPROP_XDISTANCE), 
                 (int)ObjectGetInteger(0, m_labels[labelIndex].Name(), OBJPROP_YDISTANCE), 
                 textColor);
   }

   void HideUI()
   {
      if(!m_isUIVisible) return;
      
      for(int i = 0; i < ArraySize(m_labels); i++)
      {
         if(m_labels[i] != NULL)
         {
            m_labels[i].Hide();
         }
      }
      
      ObjectDelete(0, m_backgroundName);
      ObjectDelete(0, m_borderName);

      ChartRedraw(0);
      
      m_isUIVisible = false;
   }

   void ShowUI()
   {
      if(m_isUIVisible) return;
      
      for(int i = 0; i < ArraySize(m_labels); i++)
      {
         if(m_labels[i] != NULL)
         {
            m_labels[i].Show();
         }
      }
      
      UpdateBackgroundSize();
      
      ChartRedraw(0);
      
      m_isUIVisible = true;
   }
};

#endif


