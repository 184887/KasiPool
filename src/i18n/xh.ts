import type { Dictionary } from "./config";

/**
 * isiXhosa, keyed by the English text. DRAFT: to be checked by a first-language speaker before
 * launch, above all the money and payment wording. Keep {placeholders} and <tags> exactly as in
 * the English (src/test/i18n.test.ts checks this and that nothing is missing).
 *
 * Words used throughout: pool = iqela, deal = idili, order = iodolo, stock = isitokhwe,
 * business = ishishini, confirm = qinisekisa, pay = hlawula, map pin = iphini yemephu.
 */
export const xh: Dictionary = {
  ui: {
    // Navigation and shell
    Home: "Ekhaya",
    Deals: "Iidili",
    "My Pools": "Amaqela am",
    Profile: "Iprofayile",
    Notifications: "Izaziso",
    "Notifications ({n} unread)": "Izaziso ({n} ezingafundwanga)",
    "Log in": "Ngena",
    "Log out": "Phuma",
    "How it works": "Isebenza njani",
    "Help & contact": "Uncedo noqhagamshelwano",
    "Legal (draft)": "Ezomthetho (idrafti)",
    "Terms of use": "Imigaqo yokusebenzisa",
    "Privacy notice": "Isaziso sobumfihlo",
    "Loading…": "Iyalayisha…",
    "Go back": "Buyela umva",
    Close: "Vala",
    "This page didn't load": "Eli phepha alivulekanga",
    "It may be your connection. Check your data or Wi-Fi, then try again.":
      "Isenokuba yi-intanethi yakho. Jonga idatha okanye i-Wi-Fi, uze uzame kwakhona.",
    "Try again": "Zama kwakhona",
    "Go home": "Yiya ekhaya",
    "We can't find this page": "Asilifumani eli phepha",
    "The link may be old or typed wrong. Try the deals page instead.":
      "Ilinki isenokuba indala okanye ibhalwe kakubi. Zama iphepha leedili.",
    "This page is only in English.": "Eli phepha likwisiNgesi kuphela.",
    "<b>Draft for review.</b> This content is a placeholder and must be reviewed by legal and operational advisers before KasiPool launches.":
      "<b>Idrafti esaza kujongwa.</b> Lo mxholo ngowethutyana. Kufuneka ujongwe ngabacebisi bomthetho nabokusebenza ngaphambi kokuba iKasiPool iqale.",

    // Home and how it works
    "For local businesses: shops, salons, car washes, bakeries and more. Order together and pay the bulk price. You pay only when your stock arrives.":
      "Ngawo onke amashishini asekuhlaleni: iivenkile, iisaluni, iindawo zokuhlamba iimoto, iibhekhari nokunye. Odolani kunye nihlawule ixabiso lokuthenga ngobuninzi. Uhlawula kuphela xa isitokhwe sakho sifikile.",
    "See deals": "Bona iidili",
    "See all deals": "Bona zonke iidili",
    "See more deals": "Bona ezinye iidili",
    "Closing soon": "Ziyavalwa kungekudala",
    "No open deals right now": "Akukho dili livulekileyo ngoku",
    "We add new deals often. Come back soon.": "Sihlala sifaka iidili ezintsha. Buya kungekudala.",
    "Do you run a local business?": "Ingaba uneshishini lasekuhlaleni?",
    "Register your business to join pools and get bulk prices.":
      "Bhalisa ishishini lakho ukuze ujoyine amaqela ufumane amaxabiso okuthenga ngobuninzi.",
    "Register your business": "Bhalisa ishishini lakho",
    "Your next step": "Inyathelo lakho elilandelayo",
    "Your next steps": "Amanyathelo akho alandelayo",
    "and 1 more order needs you": "kunye nenye iodolo efuna wena",
    "and {n} more orders need you": "kunye nezinye ii-odolo ezi-{n} ezifuna wena",
    "Open My Pools": "Vula Amaqela am",
    "Open order": "Vula iodolo",
    "Choose a deal": "Khetha idili",
    "Look at the product, the price and the closing date.":
      "Jonga imveliso, ixabiso nomhla wokuvala.",
    "Join the pool": "Joyina iqela",
    "Choose how many you want. You don't pay yet.":
      "Khetha ukuba ufuna zingaphi. Awuhlawuli okwangoku.",
    "Confirm your order": "Qinisekisa iodolo yakho",
    "When the pool is full, check your total and confirm. Choose cash or bank transfer.":
      "Xa iqela ligcwele, jonga isixa sakho uqinisekise. Khetha ikheshi okanye ukudlulisela ngebhanki.",
    "Get it, then pay": "Yifumane, emva koko uhlawule",
    "A courier brings your stock to your business. Then you pay.":
      "Ikhuriya izisa isitokhwe sakho eshishinini lakho. Emva koko uyahlawula.",
    "How KasiPool works": "Isebenza njani iKasiPool",
    "Many businesses. One big order. Better prices for everyone.":
      "Amashishini amaninzi. Iodolo enye enkulu. Amaxabiso angcono kumntu wonke.",
    "Common questions": "Imibuzo ebuzwa rhoqo",
    "Do I pay when I join a pool?": "Ingaba ndiyahlawula xa ndijoyina iqela?",
    "No. You pay when your stock arrives, in cash or by bank transfer (EFT).":
      "Hayi. Uhlawula xa isitokhwe sakho sifikile, ngekheshi okanye ngokudlulisela ngebhanki (EFT).",
    "What if the pool does not fill up?": "Kuthekani xa iqela lingagcwali?",
    "The deal stops and you pay nothing.": "Idili liyayeka kwaye awuhlawuli nto.",
    "Can I change my order?": "Ndingayitshintsha iodolo yam?",
    "Yes. While the pool is open, you can change how many you want, or leave the pool.":
      "Ewe. Xa iqela lisavulekile, ungatshintsha ukuba ufuna zingaphi, okanye uphume eqeleni.",
    "How do I pay?": "Ndihlawula njani?",
    "When you confirm your order, choose cash or bank transfer. Cash: pay at the door when your stock arrives. Bank transfer: use your order number as the reference, then send us a photo of your payment slip in the app. Your order shows 'Paid' when we find the money in our bank account.":
      "Xa uqinisekisa iodolo yakho, khetha ikheshi okanye ukudlulisela ngebhanki. Ikheshi: hlawula emnyango xa isitokhwe sakho sifikile. Ukudlulisela ngebhanki: sebenzisa inombolo yeodolo yakho njengesalathiso, uze usithumelele umfanekiso werisiti yentlawulo kwi-app. Iodolo yakho ibonisa 'Kuhlawulwe' xa siyifumene imali kwi-akhawunti yethu yebhanki.",
    "What if some businesses don't confirm?": "Kuthekani xa amanye amashishini engaqinisekisi?",
    "The pool opens again for other businesses until the closing date. If it is still not full, the deal stops. If you paid early, we pay you back.":
      "Iqela liphinda livulelwe amanye amashishini de kube ngumhla wokuvala. Ukuba alikagcwali, idili liyayeka. Ukuba uhlawule kwangethuba, siyakubuyisela imali.",
    "How do I get my stock?": "Ndisifumana njani isitokhwe sam?",
    "A courier delivers it to the address in your profile. Each deal shows the areas it delivers to and the delivery fee for your area. When it arrives, tap 'I received my stock' on your order.":
      "Ikhuriya isizisa kwidilesi ekwiprofayile yakho. Idili ngalinye libonisa iindawo elizisa kuzo kunye nentlawulo yokuzisa kwindawo yakho. Xa sifikile, cofa 'Ndisifumene isitokhwe sam' kwiodolo yakho.",

    // Deals list and cards
    "You do not pay when you join. You pay when your stock arrives.":
      "Awuhlawuli xa ujoyina. Uhlawula xa isitokhwe sakho sifikile.",
    "Search products": "Khangela iimveliso",
    Category: "Udidi",
    All: "Zonke",
    "Nothing matches": "Akukho nto ihambelanayo",
    "Try another search or category.": "Zama olunye uphendlo okanye olunye udidi.",
    "No deals yet": "Akukabikho madili",
    "Open now": "Avulekile ngoku",
    "Opening soon": "Liza kuvulwa kungekudala",
    "No deal yet": "Akukabikho dili",
    "Want one of these? Ask for a deal, and other businesses near you can join it.":
      "Ufuna enye yezi? Cela idili, kwaye amanye amashishini akufutshane nawe angalijoyina.",
    "Ask for a deal": "Cela idili",
    "per {unit}": "nge-{unit}",
    "Save {amount}": "Gcina {amount}",
    "Too far for you ({distance})": "Kukude kakhulu kuwe ({distance})",
    "Under 1 km away": "Ngaphantsi kwe-1 km ukusuka kuwe",
    "{km} km away": "{km} km ukusuka kuwe",
    "Closes in": "Livala kwi",
    "Join pool": "Joyina iqela",
    "View sample": "Jonga umzekelo",
    "View deal": "Jonga idili",
    "Share on WhatsApp": "Yabelana ngeWhatsApp",
    "Sample deal": "Idili lomzekelo",
    "KasiPool deal: {product}.": "Idili leKasiPool: {product}.",
    "{price} per {unit} (you save {amount}).": "{price} nge-{unit} (ugcina {amount}).",
    "{price} per {unit}.": "{price} nge-{unit}.",
    "Closes {date}.": "Livala ngo-{date}.",
    "Order together with other businesses and pay the bulk price. See the deal: {link}":
      "Odola kunye namanye amashishini uhlawule ixabiso lokuthenga ngobuninzi. Bona idili: {link}",

    // Pool progress and small parts
    "of {target} {units}": "kwi-{target} {units}",
    ordered: "ziodoliwe",
    "Pool progress": "Inkqubela yeqela",
    "Be the first business to join": "Yiba lishishini lokuqala ukujoyina",
    "1 business joined": "Kujoyine ishishini eli-1",
    "{n} businesses joined": "Kujoyine amashishini angama-{n}",
    "{n} more needed": "Kufuneka ezinye ezi-{n}",
    Closed: "Livaliwe",
    "Decrease quantity": "Nciphisa inani",
    Quantity: "Inani",
    "Increase quantity": "Yongeza inani",
    Current: "Ngoku",

    // Units (from the products table)
    bag: "ingxowa",
    bags: "iingxowa",
    bale: "ibhali",
    bales: "iibhali",
    box: "ibhokisi",
    boxes: "iibhokisi",
    case: "ikheyisi",
    cases: "iikheyisi",
    carton: "ikhathoni",
    cartons: "iikhathoni",
    pack: "ipakethi",
    packs: "iipakethi",

    // Categories (from the categories table)
    "Cooking Oil": "Ioyile yokupheka",
    Rice: "Irayisi",
    Sugar: "Iswekile",
    "Maize Meal": "Umgubo wombona",
    Flour: "Umgubo",
    Beverages: "Iziselo",
    "Cleaning Products": "Izinto zokucoca",
    "Other Groceries": "Ezinye iigrosari",
    "Hair & Beauty": "Iinwele nobuhle",
    "Car Care": "Ukunakekela imoto",
    Baking: "Ukubhaka",

    // Deal page
    "Deal not found": "Idili alifumanekanga",
    "Leave this pool?": "Uphuma kweli qela?",
    "Your place in the pool goes. You can join again while it is open.":
      "Indawo yakho eqeleni iyalahleka. Ungaphinda ujoyine xa lisavulekile.",
    "Leave pool": "Phuma eqeleni",
    "Stay in": "Hlala",
    "You've left this pool.": "Uphumile kweli qela.",
    "All deals": "Zonke iidili",
    "This is a sample deal": "Eli lidili lomzekelo",
    "It shows how KasiPool works. The prices are examples. You can't join it.":
      "Libonisa indlela esebenza ngayo iKasiPool. Amaxabiso yimizekelo. Awunakulijoyina.",
    "sold per {unit}": "lithengiswa nge-{unit}",
    "KasiPool price per {unit}": "Ixabiso leKasiPool nge-{unit}",
    "Price to be confirmed": "Ixabiso liza kuqinisekiswa",
    "Normal price:": "Ixabiso eliqhelekileyo:",
    "You save {amount} per {unit} ({pct}%)": "Ugcina {amount} nge-{unit} ({pct}%)",
    "Source:": "Umthombo:",
    "We don't know the normal price, so we can't show a saving.":
      "Asilazi ixabiso eliqhelekileyo, ngoko asinakubonisa ukonga.",
    "Other fees:": "Ezinye iintlawulo:",
    none: "azikho",
    "Needed in total": "Ezifunekayo zizonke",
    Closes: "Livala",
    left: "eseleyo",
    "The pool is full. It is closing now.": "Iqela ligcwele. Liyavalwa ngoku.",
    "The pool is full. Businesses are now confirming their orders.":
      "Iqela ligcwele. Amashishini ngoku aqinisekisa ii-odolo zawo.",
    "<b>Open again.</b> Some businesses did not confirm their orders. This deal needs {qty} more by {date}.":
      "<b>Livulekile kwakhona.</b> Amanye amashishini akazange aziqinisekise ii-odolo zawo. Eli dili lifuna ezinye ezi-{qty} ngo-{date}.",
    "Not enough businesses joined in time. You do not need to pay.":
      "Akukho mashishini aneleyo ajoyine ngexesha. Akufuneki uhlawule.",
    "You already have an order in this deal.": "Sele unayo iodolo kweli dili.",
    "See My Pools": "Bona Amaqela am",
    "You are in this pool with {qty}. You can change the number below.":
      "Ukweli qela nge-{qty}. Ungalitshintsha inani elingezantsi.",
    "How many {units}?": "Zingaphi {units}?",
    "Your total if the pool fills up": "Isixa sakho xa iqela ligcwala",
    "You can order up to {qty}.": "Ungaodola ukuya kuthi ga kwi-{qty}.",
    "Too far for you": "Kukude kakhulu kuwe",
    "Add your area first": "Qala ufake indawo yakho",
    "Saving…": "Iyagcina…",
    "Change my order": "Tshintsha iodolo yam",
    "Join this pool": "Joyina eli qela",
    "Leave this pool": "Phuma kweli qela",
    "You do not pay now. When the pool is full, we ask you to confirm your order. You pay when your stock arrives. The deal also depends on the supplier having stock.":
      "Awuhlawuli ngoku. Xa iqela ligcwele, siza kukucela uqinisekise iodolo yakho. Uhlawula xa isitokhwe sakho sifikile. Idili likwaxhomekeke ekubeni umthengisi abe nesitokhwe.",
    Delivery: "Ukuzisa",
    "A courier brings the stock to your business.": "Ikhuriya izisa isitokhwe eshishinini lakho.",
    "Delivery costs <b>{fee}</b> per order. We add it to your total.":
      "Ukuzisa kubiza <b>{fee}</b> nge-odolo nganye. Siyongeza kwisixa sakho.",
    "Delivery is free.": "Ukuzisa simahla.",
    "Only businesses close to each other can join, so the driver can deliver to all of them.":
      "Ngamashishini akufutshane omnye komnye kuphela anokujoyina, ukuze umqhubi abazisele bonke.",
    "This deal is for businesses within <b>{radius} km</b>. You are <b>under 1 km</b> away.":
      "Eli dili lelamashishini angaphakathi kwe-<b>{radius} km</b>. Ukude <b>ngaphantsi kwe-1 km</b>.",
    "This deal is for businesses within <b>{radius} km</b>. You are <b>{km} km</b> away.":
      "Eli dili lelamashishini angaphakathi kwe-<b>{radius} km</b>. Ukude nge-<b>{km} km</b>.",
    "Most deals are for businesses within {km} km.":
      "Uninzi lweedili lelamashishini angaphakathi kwe-{km} km.",
    "This deal is too far from you.": "Eli dili likude kakhulu kuwe.",
    "See deals near you": "Bona iidili ezikufutshane nawe",
    or: "okanye",
    "ask for this deal near you": "cela eli dili kufutshane nawe",
    "Please add your township or area in your profile first.":
      "Nceda uqale ufake ilokishi okanye indawo yakho kwiprofayile yakho.",
    "Go to your profile": "Yiya kwiprofayile yakho",
    "Private group, code {code}": "Iqela labucala, ikhowudi {code}",
    "Copy the invite link": "Kopa ilinki yesimemo",
    "Link copied. Send it to the businesses in your group.":
      "Ilinki ikopiwe. Yithumele kumashishini akwiqela lakho.",
    "Order changed!": "Iodolo itshintshiwe!",
    "You joined the pool!": "Ujoyine iqela!",
    "You are in for {qty} of {product}. When the pool is full, we will tell you. Then you confirm your order. You pay when your stock arrives.":
      "Ungene nge-{qty} ze-{product}. Xa iqela ligcwele, siza kukwazisa. Emva koko uqinisekise iodolo yakho. Uhlawula xa isitokhwe sakho sifikile.",

    // Sign in and register
    "Enter a valid South African mobile number, e.g. 072 123 4567":
      "Faka inombolo yeselfowuni yaseMzantsi Afrika esebenzayo, umz. 072 123 4567",
    "Your PIN must be 6 digits": "IPIN yakho mayibe ziinombolo ezi-6",
    "The two PINs don't match": "Ii-PIN ezimbini azifani",
    "Welcome back": "Wamkelekile kwakhona",
    "Log in with your mobile number and PIN.": "Ngena ngenombolo yeselfowuni yakho nePIN.",
    "Step 1 of 2: choose a PIN with 6 numbers.":
      "Inyathelo 1 kwa-2: khetha iPIN eneenombolo ezi-6.",
    "Mobile number": "Inombolo yeselfowuni",
    "Choose a PIN (6 numbers)": "Khetha iPIN (iinombolo ezi-6)",
    "Enter the PIN again": "Phinda ufake iPIN",
    "Keep your PIN secret. Do not use your birthday or 123456.":
      "Gcina iPIN yakho iyimfihlo. Musa ukusebenzisa umhla wakho wokuzalwa okanye 123456.",
    "Please wait…": "Nceda ulinde…",
    "Create account": "Yenza iakhawunti",
    "Forgot your PIN?": "Uyilibele iPIN yakho?",
    "New to KasiPool?": "Umtsha kwiKasiPool?",
    "Already registered?": "Sele ubhalisile?",
    Register: "Bhalisa",
    "If you continue, you agree to the <terms>draft terms</terms> and <privacy>privacy notice</privacy> (in English).":
      "Ukuba uyaqhubeka, uyavumelana <terms>nemigaqo eyidrafti</terms> kunye <privacy>nesaziso sobumfihlo</privacy> (kwisiNgesi).",
    "WhatsApp {n}": "WhatsApp {n}",
    "call {n}": "tsalela {n}",
    "email {n}": "thumela i-imeyile ku-{n}",
    "To get a new PIN, <b>{reach}</b> from the number you registered with. We will check it is you and give you a new PIN.":
      "Ukuze ufumane iPIN entsha, <b>{reach}</b> usebenzisa inombolo obhalise ngayo. Siza kujonga ukuba nguwe size sikunike iPIN entsha.",
    "To get a new PIN, contact KasiPool from the number you registered with. We will check it is you and give you a new PIN.":
      "Ukuze ufumane iPIN entsha, qhagamshelana neKasiPool usebenzisa inombolo obhalise ngayo. Siza kujonga ukuba nguwe size sikunike iPIN entsha.",
    "Wrong mobile number or PIN": "Inombolo yeselfowuni okanye iPIN ayichanekanga",
    "This number is already registered. Log in instead.":
      "Le nombolo sele ibhalisiwe. Ngena endaweni yoko.",
    "Too many tries. Please wait a few minutes.":
      "Uzame kaninzi kakhulu. Nceda ulinde imizuzu embalwa.",
    "You can't register right now. Please try again later.":
      "Awunakubhalisa ngoku. Nceda uzame kwakhona emva kwexesha.",

    // Business details
    "Step 2 of 2": "Inyathelo 2 kwa-2",
    "Tell us about your business": "Sixelele ngeshishini lakho",
    "We need this to deliver your stock and to contact you about your orders.":
      "Siyakudinga oku ukuze sizise isitokhwe sakho kwaye siqhagamshelane nawe malunga nee-odolo zakho.",
    "Enter a South African cellphone number, like 072 123 4567":
      "Faka inombolo yeselfowuni yaseMzantsi Afrika, njenge-072 123 4567",
    "Tell us what type of business you have": "Sixelele ukuba loluphi uhlobo lweshishini onalo",
    "Tell us your address, or how to find your business":
      "Sixelele idilesi yakho, okanye indlela yokufumana ishishini lakho",
    "Enter the other address": "Faka enye idilesi",
    "Enter the area of the other address": "Faka indawo yenye idilesi",
    "Please accept the terms and privacy notice": "Nceda wamkele imigaqo nesaziso sobumfihlo",
    'We could not find "{area}" on the map. Check the spelling, or set the map pin.':
      'Asikwazanga ukufumana "{area}" kwimephu. Jonga upelo, okanye ubeke iphini yemephu.',
    'We could not find "{area}" on the map. Check the spelling, or set the map pin for the other address.':
      'Asikwazanga ukufumana "{area}" kwimephu. Jonga upelo, okanye ubeke iphini yemephu yenye idilesi.',
    Saved: "Kugciniwe",
    "Business name *": "Igama leshishini *",
    "Your name *": "Igama lakho *",
    "Cellphone number *": "Inombolo yeselfowuni *",
    "Email (optional)": "I-imeyile (ayinyanzelekanga)",
    "Type of business": "Uhlobo lweshishini",
    "What type of business? *": "Loluphi uhlobo lweshishini? *",
    "e.g. Phone repairs": "umz. Ukulungisa iifowuni",
    "Township or area *": "Ilokishi okanye indawo *",
    "e.g. Khayelitsha": "umz. Khayelitsha",
    "City *": "Isixeko *",
    "Province *": "Iphondo *",
    "Address or directions *": "Idilesi okanye imikhombandlela *",
    "Street and number if you have one, and a place nearby, e.g. opposite the Site C taxi rank":
      "Isitrato nenombolo ukuba unazo, nendawo ekufutshane, umz. ngaphesheya kwerenki yeeteksi yaseSite C",
    "Postal code (optional)": "Ikhowudi yeposi (ayinyanzelekanga)",
    "Deliver my stock to another address": "Zisa isitokhwe sam kwenye idilesi",
    "Area of the other address *": "Indawo yenye idilesi *",
    "e.g. Harare, Khayelitsha": "umz. Harare, Khayelitsha",
    "Other address or directions *": "Enye idilesi okanye imikhombandlela *",
    "Where must the driver bring your stock?": "Umqhubi makasizise phi isitokhwe sakho?",
    "Map pin for the other address": "Iphini yemephu yenye idilesi",
    "The driver uses this pin to find the other address. Best set when you are there. You can do it later, but you need it to confirm an order.":
      "Umqhubi usebenzisa le phini ukufumana enye idilesi. Kungcono uyibeke xa ukhona apho. Ungayenza kamva, kodwa uyayidinga ukuze uqinisekise iodolo.",
    "Send me new deals on WhatsApp": "Ndithumelele iidili ezintsha ngeWhatsApp",
    "I accept the <terms>terms</terms> and <privacy>privacy notice</privacy> (in English).":
      "Ndiyayamkela <terms>imigaqo</terms> kunye <privacy>nesaziso sobumfihlo</privacy> (kwisiNgesi).",
    "Save changes": "Gcina utshintsho",
    "Finish registration": "Gqiba ukubhalisa",
    "Spaza / general dealer": "Ispaza / ivenkile yempahla ngempahla",
    "Takeaway / food vendor": "Ukutya okuthathwayo / umthengisi wokutya",
    "Restaurant / catering": "Indawo yokutyela / ukupheka imisitho",
    "Tavern / shebeen": "Ithaveni / ishebeen",
    "Hair & beauty salon": "Isaluni yeenwele nobuhle",
    "Car wash": "Indawo yokuhlamba iimoto",
    Bakery: "Ibhekhari",
    Butchery: "Isilarha",
    "Fruit & veg": "Iziqhamo nemifuno",
    "Hardware / building": "Izixhobo / ukwakha",
    Clothing: "Iimpahla zokunxiba",
    "Crèche / school": "Ikresh / isikolo",
    "Church / organisation": "Icawa / umbutho",
    Other: "Okunye",

    // Map pin
    "Map pin": "Iphini yemephu",
    "Type a street, suburb or township": "Bhala isitrato, ihlomela-dolophu okanye ilokishi",
    "No matching places found. Try a nearby suburb or landmark.":
      "Akukho ndawo ihambelanayo efunyenweyo. Zama ihlomela-dolophu elikufutshane okanye uphawu olwaziwayo.",
    "Search is not working now. Try again, or use where you are now.":
      "Ukukhangela akusebenzi ngoku. Zama kwakhona, okanye usebenzise apho ukhoyo ngoku.",
    "Location is not available on this device": "Indawo ayifumaneki kwesi sixhobo",
    "We could not find where you are. Allow location on your phone, or search.":
      "Asikwazanga ukufumana apho ukhoyo. Vumela indawo kwifowuni yakho, okanye ukhangele.",
    "Search your street or area": "Khangela isitrato okanye indawo yakho",
    "Street or area, like Site C": "Isitrato okanye indawo, njengeSite C",
    Search: "Khangela",
    "Use my current location": "Sebenzisa apho ndikhoyo ngoku",
    "Pin added.": "Iphini ifakiwe.",
    "Check it on the map": "Yijonge kwimephu",
    "Many places have no street number, so the pin is how the driver finds you. Best: stand at your business and tap <b>Use my current location</b>. Not there now? You can do it later, but you need it to confirm an order.":
      "Iindawo ezininzi azinanombolo yesitrato, ngoko iphini yindlela umqhubi akufumana ngayo. Kungcono: yima eshishinini lakho ucofe <b>Sebenzisa apho ndikhoyo ngoku</b>. Awukho apho ngoku? Ungayenza kamva, kodwa uyayidinga ukuze uqinisekise iodolo.",
    "We use OpenStreetMap to search for places.":
      "Sisebenzisa i-OpenStreetMap ukukhangela iindawo.",
    "Your phone only knows roughly where you are (about {m} m). Go outside and try again.":
      "Ifowuni yakho yazi kancinci kuphela apho ukhoyo (malunga ne-{m} m). Phuma ngaphandle uzame kwakhona.",
    "Map pin saved. Thank you!": "Iphini yemephu igciniwe. Enkosi!",
    "We could not find where you are. Allow location on your phone and try again.":
      "Asikwazanga ukufumana apho ukhoyo. Vumela indawo kwifowuni yakho uzame kwakhona.",
    "Set your map pin": "Beka iphini yemephu yakho",
    "The driver uses the pin to find the other address. When you are there, tap the button. You need the pin to confirm an order.":
      "Umqhubi usebenzisa iphini ukufumana enye idilesi. Xa ukhona apho, cofa iqhosha. Uyayidinga iphini ukuze uqinisekise iodolo.",
    "The driver uses the pin to find your business. When you are there, tap the button. You need the pin to confirm an order.":
      "Umqhubi usebenzisa iphini ukufumana ishishini lakho. Xa ukhona apho, cofa iqhosha. Uyayidinga iphini ukuze uqinisekise iodolo.",
    "Finding you…": "Siyakufuna…",
    "I am at the other address now": "Ndikwenye idilesi ngoku",
    "I am at my business now": "Ndiseshishinini lam ngoku",
    "Not there? Search for the place in your profile":
      "Awukho apho? Khangela indawo kwiprofayile yakho",

    // My Pools
    "Got a private group code?": "Unayo ikhowudi yeqela labucala?",
    "e.g. AB12CD": "umz. AB12CD",
    "Checking…": "Iyajonga…",
    "Join group": "Joyina iqela",
    "Add your business details to join a pool.":
      "Faka iinkcukacha zeshishini lakho ukuze ujoyine iqela.",
    "{fee} delivery": "{fee} yokuzisa",
    "Confirm by {date}": "Qinisekisa ngo-{date}",
    "Active pools": "Amaqela asebenzayo",
    "You are not in any open pools": "Awukho kwiqela elivulekileyo",
    "Find a deal": "Fumana idili",
    "You ordered:": "Uodole:",
    "about {amount}": "malunga ne-{amount}",
    "Closes {date}": "Livala ngo-{date}",
    "Next: wait for the pool to fill up. You can change your order until it closes.":
      "Okulandelayo: linda iqela ligcwale. Ungayitshintsha iodolo yakho de livalwe.",
    "Orders in progress": "Ii-odolo eziqhubekayo",
    "Previous orders": "Ii-odolo zangaphambili",
    More: "Ngaphezulu",
    "Need a product that has no deal near you?": "Ufuna imveliso engenadili kufutshane nawe?",
    "No reference": "Akukho salathiso",
    "Paid {amount}": "Kuhlawulwe {amount}",
    "Received {date}": "Kufunyenwe ngo-{date}",
    "Private group": "Iqela labucala",
    "Check the code with the person who sent it, then type it on My Pools.":
      "Jonga ikhowudi nomntu oyithumeleyo, uze uyibhale kuAmaqela am.",
    "Go to My Pools": "Yiya kuAmaqela am",
    "Fix payment problem": "Lungisa ingxaki yentlawulo",
    "Confirm delivery": "Qinisekisa ukufika",
    "Pay what you owe": "Hlawula ityala lakho",
    "Pay and send proof": "Hlawula uthumele ubungqina",
    "Wait for bank details": "Linda iinkcukacha zebhanki",

    // Order page
    "Order not found": "Iodolo ayifumanekanga",
    "Order confirmed": "Iodolo iqinisekisiwe",
    "Thank you": "Enkosi",
    "Sent. KasiPool will contact you soon.":
      "Kuthunyelwe. IKasiPool iza kuqhagamshelana nawe kungekudala.",
    "Decline this order?": "Uyayala le odolo?",
    "You won't get this stock, and you can't undo this.":
      "Awuyi kusifumana esi sitokhwe, kwaye awunakukubuyisa oku.",
    "Decline order": "Yala iodolo",
    "Keep my order": "Gcina iodolo yam",
    "Order cancelled": "Iodolo irhoxisiwe",
    "Order {ref}": "Iodolo {ref}",
    "Please confirm": "Nceda uqinisekise",
    "The pool reached its target. Please review and confirm.":
      "Iqela lifikelele inani elifunekayo. Nceda uhlole uqinisekise.",
    Product: "Imveliso",
    "Price for each": "Ixabiso lenye nganye",
    Goods: "Iimpahla",
    "Order total": "Isixa seodolo",
    "Deliver to": "Zisa ku",
    "Confirm by": "Qinisekisa ngo",
    Free: "Simahla",
    "When you confirm, you agree to buy this amount at this price. KasiPool buys the stock first. You pay when your stock arrives. Your price will not change.":
      "Xa uqinisekisa, uyavuma ukuthenga eli nani ngeli xabiso. IKasiPool ithenga isitokhwe kuqala. Uhlawula xa isitokhwe sakho sifikile. Ixabiso lakho aliyi kutshintsha.",
    "How will you pay?": "Uza kuhlawula njani?",
    "I accept the <terms>purchase terms</terms> ({version}, in English).":
      "Ndiyayamkela <terms>imigaqo yokuthenga</terms> ({version}, kwisiNgesi).",
    Decline: "Yala",
    "Confirm my order": "Qinisekisa iodolo yam",
    Payment: "Intlawulo",
    Status: "Imeko",
    "Order number": "Inombolo yeodolo",
    "Amount to pay": "Imali ekufuneka uyihlawule",
    "Paid so far": "Ehlawuliweyo ukuza kuthi ga ngoku",
    "How you pay": "Indlela ohlawula ngayo",
    Change: "Tshintsha",
    "Keep paying in cash": "Qhubeka uhlawula ngekheshi",
    "Keep paying by EFT": "Qhubeka uhlawula nge-EFT",
    "Have {amount} ready in cash when your stock arrives.":
      "Lungiselela {amount} ngekheshi xa isitokhwe sakho sifika.",
    "Count the stock first, then pay. KasiPool marks your order “Paid” when we get the money.":
      "Bala isitokhwe kuqala, uze uhlawule. IKasiPool iphawula iodolo yakho ngokuthi “Kuhlawulwe” xa siyifumene imali.",
    Bank: "Ibhanki",
    "Account name": "Igama leakhawunti",
    "Account number": "Inombolo yeakhawunti",
    "Branch code": "Ikhowudi yesebe",
    "Courier reference": "Isalathiso sekhuriya",
    "Use this payment reference": "Sebenzisa esi salathiso sentlawulo",
    "Copy reference": "Kopa isalathiso",
    "Reference copied": "Isalathiso sikopiwe",
    "Pay before or when your stock arrives. Then send us your proof of payment. Your order shows “Paid” when we find the money in our bank account.":
      "Hlawula ngaphambi okanye xa isitokhwe sakho sifika. Emva koko sithumelele ubungqina bentlawulo. Iodolo yakho ibonisa “Kuhlawulwe” xa siyifumene imali kwi-akhawunti yethu yebhanki.",
    "<b>We don't have bank details for you yet.</b> Please do not pay by EFT yet. We will tell you when you can, or tap Change to pay in cash when your stock arrives.":
      "<b>Asikabinazo iinkcukacha zebhanki zakho.</b> Nceda ungahlawuli nge-EFT okwangoku. Siza kukwazisa xa unako, okanye cofa Tshintsha ukuze uhlawule ngekheshi xa isitokhwe sakho sifika.",
    Received: "Kufunyenwe",
    Delivered: "Kuziswe",
    "Out for delivery": "Sisendleleni",
    Completed: "Kugqityiwe",
    "The courier says they delivered your stock. Did you get it?":
      "Ikhuriya ithi isizisile isitokhwe sakho. Ingaba usifumene?",
    "Your stock is on its way.": "Isitokhwe sakho sisendleleni.",
    "I received my stock": "Ndisifumene isitokhwe sam",
    "You reported a problem on {date}: {note}. KasiPool will contact you.":
      "Uxele ingxaki ngo-{date}: {note}. IKasiPool iza kuqhagamshelana nawe.",
    "Report a problem with this delivery": "Xela ingxaki ngolu kuziswa",
    "What went wrong?": "Kwenzeke ntoni?",
    "e.g. 2 cases missing, or nothing arrived":
      "umz. kuswele iikheyisi ezi-2, okanye akufikanga nto",
    "Send to KasiPool": "Thumela kwiKasiPool",
    "Order tracking": "Ukulandelela iodolo",
    Refunds: "Imbuyekezo",
    Refunded: "Ibuyisiwe",
    "Refund due": "Imbuyekezo iyafuneka",
    "We pay refunds back to the account you paid from. Contact KasiPool if you need help.":
      "Sibuyisela imali kwi-akhawunti ohlawule ngayo. Qhagamshelana neKasiPool ukuba ufuna uncedo.",
    "Confirmed {date} · terms {version}": "Kuqinisekisiwe ngo-{date} · imigaqo {version}",
    "Cash when it arrives": "Ikheshi xa sifika",
    "Pay at the door.": "Hlawula emnyango.",
    "Bank transfer (EFT)": "Ukudlulisela ngebhanki (EFT)",
    "Pay into our bank account and send us proof.":
      "Hlawula kwi-akhawunti yethu yebhanki usithumelele ubungqina.",

    // Proof of payment
    "This file is too big. Please send a photo.":
      "Le fayile inkulu kakhulu. Nceda uthumele umfanekiso.",
    "Sent. We will check it in our bank account.":
      "Kuthunyelwe. Siza kukujonga kwi-akhawunti yethu yebhanki.",
    "We got your proof of payment ({date}). We are checking our bank account. Your order shows “Paid” when we find the money.":
      "Sibufumene ubungqina bakho bentlawulo ({date}). Sijonga i-akhawunti yethu yebhanki. Iodolo yakho ibonisa “Kuhlawulwe” xa siyifumene imali.",
    "We could not accept your last proof: {note}. Please check it and send it again.":
      "Asikwazanga ukwamkela ubungqina bakho bokugqibela: {note}. Nceda ubujonge uphinde ubuthumele.",
    "Sending…": "Iyathumela…",
    "Send a different proof": "Thumela obunye ubungqina",
    "Upload proof of payment": "Layisha ubungqina bentlawulo",
    "A photo or screenshot of your payment slip is fine. You can send it later.":
      "Umfanekiso okanye isikrini serisiti yakho yentlawulo kulungile. Ungabuthumela kamva.",

    // Notifications and profile
    "No notifications yet": "Akukabikho zaziso",
    "We will tell you here when something changes in your pools.":
      "Siza kukwazisa apha xa kukho into etshintshayo kumaqela akho.",
    Language: "Ulwimi",
    "Saved on this phone. Terms and privacy notice are in English.":
      "Kugcinwe kule fowuni. Imigaqo nesaziso sobumfihlo zikwisiNgesi.",
    "Business details": "Iinkcukacha zeshishini",
    "Add your business details to start joining pools.":
      "Faka iinkcukacha zeshishini lakho ukuze uqale ukujoyina amaqela.",

    // Ask for a deal
    "Choose a product": "Khetha imveliso",
    "Say how it is sold, like bag or box": "Yithi ithengiswa njani, njengengxowa okanye ibhokisi",
    "Enter how many are needed in total": "Faka ukuba zingaphi ezifunekayo zizonke",
    "Sent. We will check the price with the supplier, then open the deal.":
      "Kuthunyelwe. Siza kujonga ixabiso nomthengisi, size silivule idili.",
    "Add your business details to ask for a deal.":
      "Faka iinkcukacha zeshishini lakho ukuze ucele idili.",
    "Tell us what you want to buy with other businesses. We get the price from the supplier, then open the deal.":
      "Sixelele ukuba ufuna ukuthenga ntoni namanye amashishini. Sifumana ixabiso kumthengisi, size silivule idili.",
    "Product *": "Imveliso *",
    "Select…": "Khetha…",
    "Sold per (bag, box, case) *": "Ithengiswa nge (ingxowa, ibhokisi, ikheyisi) *",
    "How many are needed in total? *": "Zingaphi ezifunekayo zizonke? *",
    "All the businesses together. We check this with the supplier.":
      "Onke amashishini kunye. Siyakujonga oku nomthengisi.",
    "Last day to join": "Usuku lokugqibela lokujoyina",
    "More options (not needed)": "Ezinye iindlela (azinyanzelekanga)",
    "Most the pool can take": "Ezona zininzi iqela elinokuzithatha",
    "Smallest order per business": "Eyona odolo incinci ngeshishini",
    "Biggest order per business": "Eyona odolo inkulu ngeshishini",
    Opens: "Livula",
    "<b>There is already a deal for this product under 1 km away.</b> Join it instead, so it fills up faster.":
      "<b>Sele kukho idili lale mveliso ngaphantsi kwe-1 km ukusuka kuwe.</b> Lijoyine endaweni yoko, ukuze ligcwale ngokukhawuleza.",
    "<b>There is already a deal for this product {km} km away.</b> Join it instead, so it fills up faster.":
      "<b>Sele kukho idili lale mveliso eli-{km} km ukusuka kuwe.</b> Lijoyine endaweni yoko, ukuze ligcwale ngokukhawuleza.",
    "See the deal": "Bona idili",
    "Your business is the centre of this deal. Businesses within {km} km of you can join, so the driver can deliver to all of you.":
      "Ishishini lakho liziko leli dili. Amashishini angaphakathi kwe-{km} km ukusuka kuwe angajoyina, ukuze umqhubi anizisele nonke.",
    "Note (optional)": "Inqaku (alinyanzelekanga)",
    "e.g. We need it before month end": "umz. Siyayidinga ngaphambi kokuphela kwenyanga",
    "<b>Private group:</b> other businesses can't see this deal. Only businesses you give the code to can join.":
      "<b>Iqela labucala:</b> amanye amashishini akanakulibona eli dili. Ngamashishini owanike ikhowudi kuphela anokujoyina.",
    "Send my request": "Thumela isicelo sam",

    // Help and install
    "New to KasiPool? Read <link>how KasiPool works</link>.":
      "Umtsha kwiKasiPool? Funda <link>indlela esebenza ngayo iKasiPool</link>.",
    "Get the app": "Fumana i-app",
    "Contact KasiPool": "Qhagamshelana neKasiPool",
    "Phone:": "Ifowuni:",
    "Email:": "I-imeyile:",
    "Contact details have not been configured yet.":
      "Iinkcukacha zoqhagamshelwano azikafakwa okwangoku.",
    Payments: "Iintlawulo",
    "Pay in cash when your stock arrives, or by bank transfer. For a bank transfer, use your order number as the reference and send your proof of payment in the app. KasiPool checks it in our bank account, then your order shows “Paid”.":
      "Hlawula ngekheshi xa isitokhwe sakho sifika, okanye ngokudlulisela ngebhanki. Xa udlulisela ngebhanki, sebenzisa inombolo yeodolo yakho njengesalathiso uze uthumele ubungqina bentlawulo kwi-app. IKasiPool iyabujonga kwi-akhawunti yethu yebhanki, emva koko iodolo yakho ibonisa “Kuhlawulwe”.",
    "Get the KasiPool app": "Fumana i-app yeKasiPool",
    "Open KasiPool from your home screen, like any app.":
      "Vula iKasiPool kwisikrini sakho sasekhaya, njengayo nayiphi na i-app.",
    Install: "Faka",
    "Open this page in <b>Safari</b> to add KasiPool to your home screen.":
      "Vula eli phepha kwi-<b>Safari</b> ukuze ufake iKasiPool kwisikrini sakho sasekhaya.",
    "Tap <share>Share</share> in Safari, then <b>Add to Home Screen</b>.":
      "Cofa <share>Yabelana</share> kwi-Safari, emva koko <b>Add to Home Screen</b>.",
    "You are using the KasiPool app. It is on your home screen.":
      "Usebenzisa i-app yeKasiPool. Ikwisikrini sakho sasekhaya.",
    "Put KasiPool on your phone's home screen and open it like any other app. It is free and you do not need the Play Store or App Store.":
      "Beka iKasiPool kwisikrini sasekhaya sefowuni yakho uyivule njengayo nayiphi na enye i-app. Isimahla kwaye awudingi iPlay Store okanye iApp Store.",
    "Install KasiPool": "Faka iKasiPool",
    "Open KasiPool in Chrome.": "Vula iKasiPool kwi-Chrome.",
    "Tap the menu (three dots) at the top right.":
      "Cofa imenyu (amachaphaza amathathu) phezulu ngasekunene.",
    "Tap <b>Install app</b> or <b>Add to Home screen</b>.":
      "Cofa <b>Install app</b> okanye <b>Add to Home screen</b>.",
    "Open KasiPool in Safari.": "Vula iKasiPool kwi-Safari.",
    "Tap the Share button": "Cofa iqhosha lokwabelana",
    "at the bottom.": "ezantsi.",
    "Tap <b>Add to Home Screen</b>, then <b>Add</b>.":
      "Cofa <b>Add to Home Screen</b>, emva koko <b>Add</b>.",

    // Status labels (src/lib/status.ts)
    "Coming soon": "Liyeza",
    "Open to join": "Livulekile ukujoyina",
    "Target reached": "Inani lifikelelwe",
    "Getting your stock": "Silanda isitokhwe sakho",
    "Deal failed": "Idili aliphumelelanga",
    "Deal cancelled": "Idili lirhoxisiwe",
    "No payment yet": "Akukabikho ntlawulo",
    "Pay when delivered": "Hlawula xa kuziswe",
    "Checking payment": "Sijonga intlawulo",
    Paid: "Kuhlawulwe",
    "Payment problem": "Ingxaki yentlawulo",
    Expired: "Liphelelwe lixesha",
    Confirmed: "Kuqinisekisiwe",
    "Not confirmed": "Akuqinisekiswanga",
    Cancelled: "Kurhoxisiwe",
    "Stock ordered": "Isitokhwe siodoliwe",
    "Stock ready": "Isitokhwe silungile",
    "Some stock is missing": "Esinye isitokhwe asikho",
    "Some stock missing": "Esinye isitokhwe asikho",
    "Cash on delivery": "Ikheshi xa kuziswa",
    "You joined": "Ujoyinile",
    "your shop": "ivenkile yakho",

    // Errors made in the app
    "No connection. Check your data and try again.":
      "Akukho nxibelelwano. Jonga idatha yakho uzame kwakhona.",
    "Something went wrong. Please try again.":
      "Kukho into engahambanga kakuhle. Nceda uzame kwakhona.",
  },

  server: {
    // Notifications (titles)
    "You joined a pool": "Ujoyine iqela",
    "The pool is full: please confirm": "Iqela ligcwele: nceda uqinisekise",
    "We are ordering your stock": "Siodola isitokhwe sakho",
    "The deal is open again": "Idili livulekile kwakhona",
    "Deal failed: we will pay you back": "Idili aliphumelelanga: siza kukubuyisela imali",
    "Order closed": "Iodolo ivaliwe",
    "Payment received": "Intlawulo ifunyenwe",
    "Part payment received": "Inxenye yentlawulo ifunyenwe",
    "We could not find your payment": "Asiyifumananga intlawulo yakho",
    "Order done": "Iodolo igqityiwe",
    "Problem fixed": "Ingxaki ilungisiwe",

    // Notifications (messages)
    "You want {qty}. You do not pay now. We will tell you when the pool is full.":
      "Ufuna {qty}. Awuhlawuli ngoku. Siza kukwazisa xa iqela ligcwele.",
    "The {product} pool is full. Please confirm your order before the deadline. You pay when your stock arrives.":
      "Iqela le-{product} ligcwele. Nceda uqinisekise iodolo yakho ngaphambi komhla wokugqibela. Uhlawula xa isitokhwe sakho sifika.",
    "The {product} pool is full. Please confirm your order before the deadline. You pay when your stock arrives. First set your map pin: you need it to confirm.":
      "Iqela le-{product} ligcwele. Nceda uqinisekise iodolo yakho ngaphambi komhla wokugqibela. Uhlawula xa isitokhwe sakho sifika. Qala ubeke iphini yemephu yakho: uyayidinga ukuze uqinisekise.",
    "Order {ref} is confirmed. Pay R{amount} in cash when your stock arrives.":
      "Iodolo {ref} iqinisekisiwe. Hlawula R{amount} ngekheshi xa isitokhwe sakho sifika.",
    "Order {ref} is confirmed. Pay when your stock arrives: by EFT with reference {ref2}, then send us your proof of payment in the app.":
      "Iodolo {ref} iqinisekisiwe. Hlawula xa isitokhwe sakho sifika: nge-EFT usebenzisa isalathiso {ref2}, uze usithumelele ubungqina bentlawulo kwi-app.",
    "Enough shops confirmed for the {product} pool. We are ordering the stock now. You pay when it arrives.":
      "Iivenkile ezaneleyo ziqinisekisile kwiqela le-{product}. Siodola isitokhwe ngoku. Uhlawula xa sifika.",
    "Some shops did not confirm, so the {product} deal is open again. It needs {qty} more. Your order is safe. If the pool does not fill up by the closing date, it is cancelled.":
      "Ezinye iivenkile azizange ziqinisekise, ngoko idili le-{product} livulekile kwakhona. Lifuna ezinye ezi-{qty}. Iodolo yakho ikhuselekile. Ukuba iqela aligcwali ngomhla wokuvala, liyarhoxiswa.",
    "Not enough shops confirmed for the {product} pool. You do not need to pay.":
      "Akukho venkile zaneleyo eziqinisekisileyo kwiqela le-{product}. Akufuneki uhlawule.",
    "Not enough shops confirmed for the {product} pool. We will pay back your money.":
      "Akukho venkile zaneleyo eziqinisekisileyo kwiqela le-{product}. Siza kukubuyisela imali yakho.",
    "Not enough shops joined the {product} pool. You do not need to pay.":
      "Akukho venkile zaneleyo ezijoyine iqela le-{product}. Akufuneki uhlawule.",
    "You did not confirm your {product} order in time, so it is closed.":
      "Awuzange uyiqinisekise iodolo yakho ye-{product} ngexesha, ngoko ivaliwe.",
    "We got your payment for order {ref}. Thank you.":
      "Siyifumene intlawulo yakho yeodolo {ref}. Enkosi.",
    "We got R{amount} for order {ref}. You still owe R{owed}.":
      "Sifumene R{amount} yeodolo {ref}. Usatyala R{owed}.",
    "Your proof of payment for order {ref} was not accepted: {note}. Please check it and upload it again.":
      "Ubungqina bakho bentlawulo yeodolo {ref} abamkelwanga: {note}. Nceda ubujonge uphinde ubulayishe.",
    "The supplier did not send all the {product}. You only pay for what you get, and we will pay back the difference.":
      "Umthengisi akazithumelanga zonke i-{product}. Uhlawula kuphela oko ukufumeneyo, kwaye siza kukubuyisela umahluko.",
    "The supplier did not send all the {product}. You only pay for what you get.":
      "Umthengisi akazithumelanga zonke i-{product}. Uhlawula kuphela oko ukufumeneyo.",
    "Your {product} is on the way to {address}.": "I-{product} yakho isendleleni eya ku-{address}.",
    "Your {product} is on its way to {address}.": "I-{product} yakho isendleleni eya ku-{address}.",
    "The courier says they delivered order {ref}. Did you get it? Please tell us in the app.":
      "Ikhuriya ithi iyizisile iodolo {ref}. Ingaba uyifumene? Nceda usixelele kwi-app.",
    "Thank you. Order {ref} is done.": "Enkosi. Iodolo {ref} igqityiwe.",
    "We cancelled this deal. If you paid, we will pay you back.":
      "Silirhoxisile eli dili. Ukuba uhlawulile, siza kukubuyisela imali.",
    "We cancelled this deal. You do not need to pay.":
      "Silirhoxisile eli dili. Akufuneki uhlawule.",
    "There is a problem with your payment. Please contact KasiPool.":
      "Kukho ingxaki ngentlawulo yakho. Nceda uqhagamshelane neKasiPool.",
    "KasiPool fixed the problem you told us about.":
      "IKasiPool iyilungisile ingxaki osixelele ngayo.",

    // Errors from the database
    "Please log in first": "Nceda uqale ungene",
    "Please add your business details first": "Nceda uqale ufake iinkcukacha zeshishini lakho",
    "Please add your shop details first": "Nceda uqale ufake iinkcukacha zevenkile yakho",
    "Please add your township or area in your profile first":
      "Nceda uqale ufake ilokishi okanye indawo yakho kwiprofayile yakho",
    "Please add your address and area in your profile first":
      "Nceda uqale ufake idilesi nendawo yakho kwiprofayile yakho",
    "Set your map pin first, so the driver can find you":
      "Qala ubeke iphini yemephu yakho, ukuze umqhubi akufumane",
    "Choose how you will pay": "Khetha indlela oza kuhlawula ngayo",
    "Choose EFT or cash": "Khetha i-EFT okanye ikheshi",
    "Please tick the box to accept the terms": "Nceda uphawule ibhokisi ukuze wamkele imigaqo",
    "The time to confirm is over": "Ixesha lokuqinisekisa liphelile",
    "You can't confirm this order any more": "Awusakwazi ukuyiqinisekisa le odolo",
    "You can't change how you pay for this order":
      "Awunakuyitshintsha indlela ohlawula ngayo le odolo",
    "This order doesn't need a proof of payment": "Le odolo ayidingi bungqina bentlawulo",
    "This order is already fully paid": "Le odolo sele ihlawulwe yonke",
    "We are checking your proof of payment. Please wait.":
      "Sijonga ubungqina bakho bentlawulo. Nceda ulinde.",
    "Please upload your proof of payment again": "Nceda uphinde ulayishe ubungqina bentlawulo",
    "This pool is closed": "Eli qela livaliwe",
    "You already have an order in this deal": "Sele unayo iodolo kweli dili",
    "You can order at most {n}": "Ungaodola ezingaphezulu kwe-{n}",
    "You must order at least {n}": "Kufuneka uodole ubuncinci ezi-{n}",
    "This pool only has space for {n} more": "Eli qela linendawo yezinye ezi-{n} kuphela",
    "This deal is only for businesses within {radius} km. You are {km} km away.":
      "Eli dili lelamashishini angaphakathi kwe-{radius} km kuphela. Ukude nge-{km} km.",
    "We don't deliver this deal to {zone} yet": "Asikalizisi eli dili ku-{zone} okwangoku",
    "You did not confirm your last order in this deal, so you can't join it again":
      "Awuzange uyiqinisekise iodolo yakho yokugqibela kweli dili, ngoko awunakuphinda ulijoyine",
    "Test shops can only join test pools.":
      "Iivenkile zovavanyo zingajoyina amaqela ovavanyo kuphela.",
    "This is a private group. Type its code to join.":
      "Eli liqela labucala. Bhala ikhowudi yalo ukuze ujoyine.",
    "This is a sample deal. You can't join it.": "Eli lidili lomzekelo. Awunakulijoyina.",
    "We can't find this code, or it is too old": "Asiyifumani le khowudi, okanye indala kakhulu",
    "You can only leave a pool while it is open": "Ungaphuma eqeleni kuphela xa lisavulekile",
    "You can't cancel this order": "Awunakuyirhoxisa le odolo",
    "This order is not on the way yet": "Le odolo ayikabikho ndleleni",
    "You can tell us about a problem when your order is on the way":
      "Ungasixelela ngengxaki xa iodolo yakho isendleleni",
    "Tell us what went wrong": "Sixelele ukuba kwenzeke ntoni",
    "Please choose a product": "Nceda ukhethe imveliso",
    "Please say how many are needed in total": "Nceda uthi zingaphi ezifunekayo zizonke",
    "The closing date must be after the opening date": "Umhla wokuvala mawube emva komhla wokuvula",
    "The most the pool can take must not be less than the number needed":
      "Ezona zininzi iqela elinokuzithatha mazingabi ngaphantsi kwenani elifunekayo",
    "You already asked for 5 deals. Please wait for us to check them.":
      "Sele ucele iidili ezi-5. Nceda ulinde sizijonge.",
    "Order not found": "Iodolo ayifumanekanga",
    "Deal not found": "Idili alifumanekanga",
    "Pool not found": "Iqela alifumanekanga",
    "Invalid quantity": "Inani alichanekanga",
    "Not authorised": "Awuvumelekanga",
  },
};
