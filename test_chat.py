import asyncio
import websockets
import json

async def test_chat():
    uri = "ws://localhost:8001/ws/chat/6c6685b8-4cfa-4e77-9f4f-43a7aa6fdc04"
    async with websockets.connect(uri) as websocket:
        print("Connected to WebSocket")
        
        message = {
            "type": "message",
            "message": "What are the key skills?"
        }
        
        await websocket.send(json.dumps(message))
        print(f"Sent: {message}")
        
        while True:
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=20.0)
                print(f"Received: {response}")
                response_json = {}
                try:
                    response_json = json.loads(response)
                except:
                    pass
                
                if "ERROR" in response:
                    print("Test Failed: Error in response")
                    break
                
                if response_json.get("type") == "system":
                    continue
                
                if response_json.get("type") == "typing":
                    continue
                    
                # If we get here, it's likely the answer message
                if response_json.get("type") == "message":
                    print("Test Passed: Received AI answer")
                    print(f"Answer: {response_json.get('message', '')[:100]}...")
                    break
            except asyncio.TimeoutError:
                print("Timeout waiting for response")
                break
            except Exception as e:
                print(f"Error: {e}")
                break

if __name__ == "__main__":
    asyncio.run(test_chat())
