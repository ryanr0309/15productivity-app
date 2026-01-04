import { useState } from "react";
import { supabase } from "../lib/supabase";


export function useCooldown(){
    const MIN_AWAKE_HOURS = 6;
    const COOLDOWN_HOURS = 4;
    const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
    const [cooldownChecked, setCooldownChecked] = useState(false);

     function getEarliestSleepTime(wakeTime: Date) {
    return new Date(wakeTime.getTime() + MIN_AWAKE_HOURS * 60 * 60 * 1000);
  }

    async function loadCooldown() {

    
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
    
        return;
      }
    
      
    
        const { data: day } = await supabase
          .from("days")
          .select("end_time")
          .eq("user_id", auth.user.id)
          .not("end_time", "is", null)
          .order("end_time", { ascending: false })
          .limit(1)
          .maybeSingle();
    
      
    
        if (!day?.end_time) {
          setCooldownEnd(null);
          return;
        }
    
        const end = new Date(day.end_time);
        const unlockMs =
          end.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000;
    
        if (Date.now() < unlockMs) {
          setCooldownEnd(new Date(unlockMs));
        } else {
          setCooldownEnd(null);
        }
    
        setCooldownChecked(true);
    
      }

      return {MIN_AWAKE_HOURS, COOLDOWN_HOURS, cooldownEnd, cooldownChecked, loadCooldown, getEarliestSleepTime}
}
