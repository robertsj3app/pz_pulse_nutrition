-- Nutrition panel for PZ Pulse, registered against the PZ Pulse extension API v1.
--
-- The spec is appended rather than constructed: an append cannot throw whatever order the
-- game loaded our Lua in, and PZ Pulse validates the spec when it drains the list, naming
-- any problem in the console and in its Shift+Z support dump.
PZ_Pulse_EXT = PZ_Pulse_EXT or {}

local function safe(fn, default)
    local ok, v = pcall(fn)
    if ok and v ~= nil then return v end
    return default
end

-- Round to 2 decimals (matches the in-game skill tooltip's round(xp, 2)). 
-- getCalories() returns things like 689.6576538085938
local function round2(v)
    v = tonumber(v) or 0
    return math.floor(v * 100 + 0.5) / 100
end

table.insert(PZ_Pulse_EXT, {
    api     = 1,
    mod     = "PZ_Nutri_Panel",
    version = "1.0.1",
    id      = "nutrition",
    title   = "Nutrition",
    cls     = "info",

    collect = function(player)
        local nut = safe(function() return player:getNutrition() end)
        if not nut then return nil end
        return {
            calories = round2(safe(function() return nut:getCalories() end, 0)),
            carbs    = round2(safe(function() return nut:getCarbohydrates() end, 0)),
            protein  = round2(safe(function() return nut:getProteins() end, 0)),
            fat      = round2(safe(function() return nut:getLipids() end, 0)),
        }
    end,

    css     = "assets/web/style/nutrition.css",
    js      = "assets/web/scripts/nutrition.js",
    render  = "renderNutritionPanel",
})