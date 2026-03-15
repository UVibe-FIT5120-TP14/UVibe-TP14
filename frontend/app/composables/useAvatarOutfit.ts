import { computed, type Ref } from 'vue'

export function useAvatarOutfit(uvIndexRef: Ref<number>) {
  const avatarOutfit = computed(() => {
    const uv = uvIndexRef.value
    const outfit: Record<string, any> = { head: null, eyes: null, torso: null, legs: null, accessory: null }

    if (uv < 3) {
      outfit.torso = { id: 'tshirt', icon: '👕', name: 'Cotton T-Shirt', description: 'Low UV. Standard cotton provides a UPF of about 5-15, which is plenty for low UV conditions. No special fabrics needed.', color: 'bg-sky-400' }
      outfit.legs = { id: 'shorts', icon: '🩳', name: 'Casual Shorts', description: 'Comfortable wear. Sunscreen is optional but recommended if you plan to stay outside for long periods.', color: 'bg-stone-300' }
    } else if (uv < 6) {
      outfit.head = { id: 'cap', icon: '🧢', name: 'Baseball Cap', description: 'Provides basic shade for the forehead and eyes. However, it leaves your neck and ears exposed to UV rays.', color: 'bg-indigo-500' }
      outfit.eyes = { id: 'shades', icon: '🕶️', name: 'UV-blocking Shades', description: 'Look for labels saying UV400 or "100% UV protection" to prevent long-term eye damage and cataracts.', color: 'bg-gray-900' }
      outfit.torso = { id: 'tshirt', icon: '👕', name: 'T-shirt (Cover Shoulders)', description: 'Shoulders burn easily. Avoid tank tops. Standard fabric offers UPF ~15. Apply sunscreen to exposed arms.', color: 'bg-teal-400' }
      outfit.legs = { id: 'long-pants', icon: '👖', name: 'Light Pants', description: 'Pants provide a physical barrier. Denim has a UPF of 1700+, but lighter tightly-woven fabrics work well too.', color: 'bg-indigo-300' }
    } else if (uv < 8) {
      outfit.head = { id: 'sunhat', icon: '👒', name: 'Broad-brimmed Hat', description: 'A brim of at least 7.5cm protects your ears and the back of your neck, which baseball caps leave completely exposed.', color: 'bg-amber-400' }
      outfit.eyes = { id: 'shades', icon: '🕶️', name: 'UV-blocking Shades', description: 'Crucial at high UV levels to protect the delicate, thin skin around your eyes from premature aging.', color: 'bg-gray-900' }
      outfit.torso = { id: 'long-shirt', icon: '👔', name: 'Tightly Woven Long Sleeves', description: 'Rule of thumb: Hold the fabric up to the light. If you can easily see through it, UV rays can get through too.', color: 'bg-emerald-400' }
      outfit.legs = { id: 'long-pants', icon: '👖', name: 'Long Pants', description: 'Maximize physical coverage to minimize your reliance on sunscreen.', color: 'bg-slate-300' }
    } else if (uv < 11) {
      outfit.head = { id: 'sunhat', icon: '👒', name: 'UPF 50+ Sun Hat', description: 'UPF 50+ fabric allows only 1/50th of UV radiation to pass through, effectively blocking 98% of harmful rays.', color: 'bg-orange-400' }
      outfit.eyes = { id: 'wrap-shades', icon: '🥽', name: 'Wrap-around Sunglasses', description: 'Standard glasses let UV rays leak in. Wrap-around styles stop scattered and reflected rays from entering the sides.', color: 'bg-gray-900' }
      outfit.torso = { id: 'jacket', icon: '🥋', name: 'UPF 50+ Zip Jacket', description: 'Synthetic fibers like polyester and nylon are excellent UV reflectors. Look for official UPF 50+ tags.', color: 'bg-cyan-400' }
      outfit.legs = { id: 'long-pants', icon: '👖', name: 'UPF 50+ Pants', description: 'Dark or bright colors absorb more UV rays than pale colors, offering significantly better protection.', color: 'bg-gray-200' }
      outfit.accessory = { id: 'umbrella', icon: '⛱️', name: 'UV Umbrella', description: 'A parasol with a black inner coating absorbs reflected UV rays from the concrete ground.', color: '' }
    } else {
      outfit.head = { id: 'legionnaire', icon: '👒', name: 'Legionnaire Hat', description: 'A wide-brim hat with a back neck flap provides the ultimate physical barrier for extreme conditions.', color: 'bg-rose-500' }
      outfit.eyes = { id: 'wrap-shades', icon: '🥽', name: 'Wrap-around Sunglasses', description: 'Essential protection against extreme UV radiation to prevent photokeratitis (snow blindness).', color: 'bg-gray-900' }
      outfit.torso = { id: 'jacket', icon: '🥷', name: 'Full UPF 50+ Tech Gear', description: 'Unprotected skin can burn in minutes. Wear long UPF 50+ sleeves and consider a UPF neck gaiter.', color: 'bg-rose-500' }
      outfit.legs = { id: 'long-pants', icon: '👖', name: 'Full UPF 50+ Pants', description: 'Absolutely no skin should be exposed. Wear long thick pants and closed shoes.', color: 'bg-zinc-200' }
      outfit.accessory = { id: 'house', icon: '🏠', name: 'Stay Indoors', description: 'The best protection is avoiding exposure entirely. Reschedule outdoor activities.', color: '' }
    }
    return outfit
  })

  return { avatarOutfit }
}