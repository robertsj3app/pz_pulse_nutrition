PZ_Pulse_Refactor = PZ_Pulse_Refactor or {}
local PC = PZ_Pulse_Refactor

local function safe(fn, default)
    local ok, v = pcall(fn)
    if ok and v ~= nil then return v end
    return default
end

-- Round to 2 decimals (matches the in-game skill tooltip's round(xp, 2)).
local function round2(v)
    v = tonumber(v) or 0
    return math.floor(v * 100 + 0.5) / 100
end

----------------------------------------------------------------------
-- collectors
----------------------------------------------------------------------

PC.Collector:new(
    "nutrition",
    function (player)
        local nut = safe(function() return player:getNutrition() end)
        if not nut then return nil end

        local out = {
            calories = round2(safe(function() return nut:getCalories() end, 0)),
            carbs    = round2(safe(function() return nut:getCarbohydrates() end, 0)),
            protein  = round2(safe(function() return nut:getProteins() end, 0)),
            fat      = round2(safe(function() return nut:getLipids() end, 0))
        }
        return out
    end
)

PC.Panel:new(
    PC.CSS.from_file("PZ_Nutri_Panel", "assets/web/style/nutrition.css"),
    PC.JS.from_file("PZ_Nutri_Panel", "assets/web/scripts/nutrition.js"),
    "nutrition",
    "Nutrition",
    "info",
    "function(d){return renderNutrition(d.info,d.nutrition);}"
)