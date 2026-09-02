"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Flame, Plus, Trash2 } from "lucide-react";
import { FoodSearchModal } from "@/components/food/FoodSearchModal";
import { Progress } from "@/components/ui/progress";

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

  const deleteItem = async (id: string) => {
    try {
      await fetch(`/api/food/log/${id}`, { method: 'DELETE' });
      fetchDailyData(currentDate);
    } catch (e) {
      console.error(e);
    }
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Food Diary</h1>
        <div className="flex items-center gap-4 bg-[hsl(var(--surface))] px-4 py-1.5 rounded-full shadow-sm border border-[hsl(var(--hairline))]">
          <Button variant="icon" className="h-6 w-6" onClick={prevDay}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-medium text-sm w-24 text-center">
            {new Date(currentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          <Button variant="icon" className="h-6 w-6" onClick={nextDay}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* MACRO SUMMARY */}
      <Card className="border-[hsl(var(--hairline))] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 bg-gradient-to-br from-[hsl(var(--surface))] to-[hsl(var(--surface-elevated))]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--ink-secondary))] tracking-wider">CALORIES IN</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-bold text-[hsl(var(--ink))]">{Math.round(totalCals)}</span>
                  <span className="text-sm text-[hsl(var(--ink-secondary))] font-medium">/ 2000 kcal</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center shadow-inner">
                <Flame className="w-7 h-7 text-orange-500" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 pt-2">
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-[hsl(var(--ink-secondary))] font-medium">Carbs</p>
                  <p className="text-xs font-semibold">{Math.round(totalCarbs)}g</p>
                </div>
                <Progress value={Math.min(100, (totalCarbs / 250) * 100)} indicatorColor="bg-blue-500" className="h-2 bg-blue-100" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-[hsl(var(--ink-secondary))] font-medium">Protein</p>
                  <p className="text-xs font-semibold">{Math.round(totalProtein)}g</p>
                </div>
                <Progress value={Math.min(100, (totalProtein / 150) * 100)} indicatorColor="bg-green-500" className="h-2 bg-green-100" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-[hsl(var(--ink-secondary))] font-medium">Fats</p>
                  <p className="text-xs font-semibold">{Math.round(totalFats)}g</p>
                </div>
                <Progress value={Math.min(100, (totalFats / 70) * 100)} indicatorColor="bg-amber-500" className="h-2 bg-amber-100" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MEALS */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-[hsl(var(--ink-secondary))]">Loading diary...</div>
        ) : (
          MEAL_TYPES.map(mealType => {
            const items = getMealItems(mealType);
            const mealCals = items.reduce((sum: number, item: any) => sum + getMealCalories(item.id), 0);
            
            return (
              <Card key={mealType} className="overflow-hidden border-[hsl(var(--hairline))] shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 bg-[hsl(var(--surface))] border-b border-[hsl(var(--hairline))]">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base font-bold capitalize text-[hsl(var(--ink))]">
                      {mealType.toLowerCase()}
                    </CardTitle>
                    {mealCals > 0 && <span className="text-xs font-semibold text-[hsl(var(--ink-secondary))] px-2 py-0.5 bg-[hsl(var(--background))] rounded-full">{Math.round(mealCals)} kcal</span>}
                  </div>
                  <Button variant="icon" className="h-8 w-8 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-active))/10]" onClick={() => openSearch(mealType)}>
                    <Plus className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0 bg-[hsl(var(--background))]">
                  {items.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-[hsl(var(--ink-muted))] italic">
                      No foods logged yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-[hsl(var(--hairline))]">
                      {items.map((item: any) => {
                        const itemCals = Math.round(getMealCalories(item.id));
                        // Find macros for this item
                        const getMacro = (key: string) => data.nutrients.find((n: any) => n.mealItemId === item.id && n.nutrientKey === key)?.amount || 0;
                        const p = Math.round(getMacro('protein'));
                        const c = Math.round(getMacro('carbohydrates'));
                        const f = Math.round(getMacro('fat'));

                        return (
                          <div key={item.id} className="p-5 flex items-start justify-between hover:bg-[hsl(var(--surface))] transition-colors group">
                            <div className="flex-1 pr-4">
                              <p className="font-semibold text-[15px] text-[hsl(var(--ink))]">{item.displaySnapshot.name}</p>
                              <p className="text-xs text-[hsl(var(--ink-secondary))] mt-1 font-medium">
                                {item.quantity} x {item.selectedPortionSnapshot.label} {item.selectedPortionSnapshot.grams ? `(${Math.round(item.selectedPortionSnapshot.grams)}g)` : ''}
                              </p>
                              <div className="flex gap-3 mt-2 text-[11px] font-semibold text-[hsl(var(--ink-muted))]">
                                <span className="text-green-600/70">P: {p}g</span>
                                <span className="text-blue-600/70">C: {c}g</span>
                                <span className="text-amber-600/70">F: {f}g</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-base font-bold text-[hsl(var(--ink))]">
                                {itemCals} <span className="text-xs font-medium text-[hsl(var(--ink-secondary))]">kcal</span>
                              </div>
                              <Button 
                                variant="icon" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--ink-muted))] hover:text-red-500" 
                                onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
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
