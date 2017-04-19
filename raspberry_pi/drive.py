import asyncio
import aiohttp.web
import pigpio
import json

pi = pigpio.pi()

pi.hardware_PWM(18, 60, 90000)
pi.hardware_PWM(19, 60, 90000)

loop = asyncio.get_event_loop()
web_app = aiohttp.web.Application(loop=loop)

async def move_drive(request):
    try:
        request_data = await request.json()
    except json.decoder.JSONDecodeError:
        return aiohttp.web.Response(status=400)

    value = request_data.get("value", None)
    #print ("Drive", value)

    if value is None:
        return aiohttp.web.Response(status=400)

    pi.hardware_PWM(18, 60, int(value))

    return aiohttp.web.Response(status=200)

async def move_rotate(request):
    try:
        request_data = await request.json()
    except json.decoder.JSONDecodeError:
        return aiohttp.web.Response(status=400)

    value = request_data.get("value", None)
    #print ("Rotate", value)

    if value is None:
        return aiohttp.web.Response(status=400)

    pi.hardware_PWM(19, 60, int(value))

    return aiohttp.web.Response(status=200)

async def move_stop(request):
    pi.hardware_PWM(18, 60, 90000)
    pi.hardware_PWM(19, 60, 90000)

    return aiohttp.web.Response(status=200)

web_app.router.add_post("/move_rotate", move_rotate)
web_app.router.add_post("/move_drive", move_drive)
web_app.router.add_post("/stop", move_stop)
aiohttp.web.run_app(web_app, host="192.168.1.220", port=2283)
