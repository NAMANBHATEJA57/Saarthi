"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Apple, Flame, Plus } from "lucide-react";
import { FoodSearchModal } from "@/components/food/FoodSearchModal";

export function FoodClient() {
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<{ meals: any[], items: any[], nutrients: any[] }>({ meals: [], items: [], nutrients: [] });
  const [loading, setLoading] = useState(true);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("BREAKFAST");

  const fetchDailyData = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/food/daily?date=${date}`);
      const json = await res.json();
      if (!json.error) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyData(currentDate);
  }, [currentDate]);

  const prevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const nextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const openSearch = (mealType: string) => {
    setSelectedMealType(mealType);
    setIsSearchOpen(true);
  };

  // Aggregation logic
  const getMacroTotal = (nutrientKey: string) => {
    if (!data.nutrients) return 0;
    return data.nutrients
      .filter((n: any) => n.nutrientKey === nutrientKey)
      .reduce((sum: number, n: any) => sum + Number(n.amount), 0);
  };

  const totalCals = getMacroTotal('energy');
  const totalProtein = getMacroTotal('protein');
  const totalCarbs = getMacroTotal('carbohydrates');
  const totalFats = getMacroTotal('fat');

  const getMealItems = (mealType: string) => {
    if (!data.meals) return [];
    const mealsOfType = data.meals.filter((m: any) => m.mealType === mealType);
    const mealIds = mealsOfType.map((m: any) => m.id);
    return (data.items || []).filter((i: any) => mealIds.includes(i.mealId));
  };

  const getMealCalories = (mealItemId: string) => {
    if (!data.nutrients) return 0;
    const n = data.nutrients.find((n: any) => n.mealItemId === mealItemId && n.nutrientKey === 'energy');
    return n ? Number(n.amount) : 0;
  };

  const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-4">
          <Button variant="utility" onClick={prevDay}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-medium text-sm sm:text-base">
            {new Date(currentDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <Button variant="utility" onClick={nextDay}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* MACRO SUMMARY */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--ink-muted))] tracking-wider">CALORIES IN</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-3xl font-bold">{Math.round(totalCals)}</span>
                <span className="text-sm text-[hsl(var(--ink-secondary))] mb-1">/ 2000 kcal</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-[hsl(var(--surface-elevated))] flex items-center justify-center border border-[hsl(var(--hairline))]">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 border-t border-[hsl(var(--hairline))] pt-4">
            <div>
              <p className="text-xs text-[hsl(var(--ink-secondary))] font-medium mb-1">Carbs</p>
              <div className="h-2 w-full bg-[hsl(var(--surface-elevated))] rounded-full overflow-hidden mb-1">
                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (totalCarbs / 250) * 100)}%` }} />
              </div>
              <p className="text-xs font-semibold">{Math.round(totalCarbs)}g</p>
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--ink-secondary))] font-medium mb-1">Protein</p>
              <div className="h-2 w-full bg-[hsl(var(--surface-elevated))] rounded-full overflow-hidden mb-1">
                <div className="h-full bg-green-500" style={{ width: `${Math.min(100, (totalProtein / 150) * 100)}%` }} />
              </div>
              <p className="text-xs font-semibold">{Math.round(totalProtein)}g</p>
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--ink-secondary))] font-medium mb-1">Fats</p>
              <div className="h-2 w-full bg-[hsl(var(--surface-elevated))] rounded-full overflow-hidden mb-1">
                <div className="h-full bg-yellow-500" style={{ width: `${Math.min(100, (totalFats / 70) * 100)}%` }} />
              </div>
              <p className="text-xs font-semibold">{Math.round(totalFats)}g</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MEALS */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-[hsl(var(--ink-secondary))]">Loading meals...</div>
        ) : (
          MEAL_TYPES.map(mealType => {
            const items = getMealItems(mealType);
            const mealCals = items.reduce((sum: number, item: any) => sum + getMealCalories(item.id), 0);
            
            return (
              <Card key={mealType} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 bg-[hsl(var(--surface))]">
                  <CardTitle className="text-base font-semibold capitalize flex items-center gap-2">
                    {mealType.toLowerCase()}
                    {mealCals > 0 && <span className="text-xs font-normal text-[hsl(var(--ink-secondary))]">{Math.round(mealCals)} kcal</span>}
                  </CardTitle>
                  <Button variant="utility" className="h-7 px-2 text-xs" onClick={() => openSearch(mealType)}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {items.length === 0 ? (
                    <div className="p-4 text-sm text-[hsl(var(--ink-secondary))]">
                      No foods logged yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-[hsl(var(--hairline))]">
                      {items.map((item: any) => (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-[hsl(var(--surface-elevated))] transition-colors">
                          <div>
                            <p className="font-medium text-sm">{item.displaySnapshot.name}</p>
                            <p className="text-xs text-[hsl(var(--ink-secondary))] mt-0.5">
                              {item.quantity} x {item.selectedPortionSnapshot.label} {item.selectedPortionSnapshot.grams ? `(${item.selectedPortionSnapshot.grams}g)` : ''}
                            </p>
                          </div>
                          <div className="text-sm font-semibold">
                            {Math.round(getMealCalories(item.id))} <span className="text-[10px] font-normal text-[hsl(var(--ink-secondary))]">kcal</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <FoodSearchModal 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen} 
        mealType={selectedMealType} 
        localDate={currentDate}
        onSuccess={() => fetchDailyData(currentDate)}
      />
    </div>
  );
}
