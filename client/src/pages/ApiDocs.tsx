import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface EndpointInfo {
  path: string;
  method: string;
  description: string;
  group: string;
}

export default function ApiDocs() {
  const [activeTab, setActiveTab] = useState("http");
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">API Documentation</h1>
        <p className="text-gray-400">Client integration guide and API reference</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-background-dark border-gray-800 shadow-lg">
          <CardHeader className="border-b border-gray-800 py-3 px-4">
            <CardTitle className="text-base font-medium">Client Connection Guide</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Alert className="mb-4 bg-yellow-950/30 border-yellow-700">
              <AlertTitle className="text-yellow-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                Connection Overview
              </AlertTitle>
              <AlertDescription className="text-sm mt-2">
                <p>This server supports both HTTP/REST API and UDP protocols. For game clients (Unity3D), use the UDP protocol for real-time state updates, while using HTTP for occasional operations like authentication or initial data loading.</p>
              </AlertDescription>
            </Alert>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="http">HTTP API</TabsTrigger>
                <TabsTrigger value="udp">UDP Protocol</TabsTrigger>
              </TabsList>
              
              <TabsContent value="http" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">HTTP API Overview</h3>
                  <p className="text-sm text-gray-400">The HTTP API is used for non-realtime operations. All endpoints return JSON responses with the following structure:</p>
                  
                  <div className="bg-black rounded-md p-3 font-mono text-xs mt-2">
                    {`{
  "success": true,
  "data": { ... },  // Present on successful requests
  "error": "Error message"  // Present on failed requests
}`}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Authentication</h3>
                  <p className="text-sm text-gray-400">Client authentication is handled via the UDP protocol handshake, but session data can be validated via HTTP:</p>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                      <span className="font-mono text-sm">/api/status</span>
                    </div>
                    <p className="text-xs text-gray-400 ml-14">Returns server status and session information</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Recommended Endpoints for Game Clients</h3>
                  <p className="text-sm text-gray-400">While most HTTP endpoints are for the admin dashboard, game clients should use:</p>
                  
                  <div className="mt-2 space-y-3">
                    <div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                        <span className="font-mono text-sm">/api/celestial</span>
                      </div>
                      <p className="text-xs text-gray-400 ml-14">Get all celestial bodies and their current positions</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                        <span className="font-mono text-sm">/api/aoi</span>
                      </div>
                      <p className="text-xs text-gray-400 ml-14">Get all areas of interest for client synchronization</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                        <span className="font-mono text-sm">/api/missions</span>
                      </div>
                      <p className="text-xs text-gray-400 ml-14">Get available missions the player can accept</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="udp" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">UDP Protocol Overview</h3>
                  <p className="text-sm text-gray-400">The UDP protocol is used for real-time state updates and player actions. All messages use a binary format with the following general structure:</p>
                  
                  <div className="bg-black rounded-md p-3 font-mono text-xs mt-2">
                    {`[2 bytes: Message Type] [4 bytes: Message Length] [N bytes: Message Payload]`}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Connection Process</h3>
                  <p className="text-sm text-gray-400">To connect to the game server:</p>
                  
                  <ol className="list-decimal ml-5 text-sm space-y-2 mt-2">
                    <li>Send a <code className="text-xs bg-gray-800 px-1 rounded">ClientConnectMessage</code> to the server's UDP port (default: 7777)</li>
                    <li>The server will respond with a <code className="text-xs bg-gray-800 px-1 rounded">ServerConnectResponseMessage</code> containing your client ID</li>
                    <li>Use this client ID in all subsequent messages</li>
                    <li>Send regular <code className="text-xs bg-gray-800 px-1 rounded">ClientHeartbeatMessage</code>s (every 5 seconds) to maintain the connection</li>
                  </ol>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Key Message Types</h3>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="connect">
                      <AccordionTrigger className="text-sm">Client-to-Server Messages</AccordionTrigger>
                      <AccordionContent className="text-xs space-y-2">
                        <div className="bg-black rounded-md p-2 font-mono">
                          <div className="text-green-400">ClientConnectMessage (Type 0x01)</div>
                          <div className="ml-4 text-gray-400">{`{ client_version: string, auth_token?: string }`}</div>
                        </div>
                        <div className="bg-black rounded-md p-2 font-mono">
                          <div className="text-green-400">ClientHeartbeatMessage (Type 0x02)</div>
                          <div className="ml-4 text-gray-400">{`{ client_id: string, timestamp: number }`}</div>
                        </div>
                        <div className="bg-black rounded-md p-2 font-mono">
                          <div className="text-green-400">ClientDisconnectMessage (Type 0x03)</div>
                          <div className="ml-4 text-gray-400">{`{ client_id: string }`}</div>
                        </div>
                        <div className="bg-black rounded-md p-2 font-mono">
                          <div className="text-green-400">ClientStateUpdateMessage (Type 0x10)</div>
                          <div className="ml-4 text-gray-400">{`{ client_id: string, position: Vector3, velocity: Vector3, rotation: Quaternion }`}</div>
                        </div>
                        <div className="bg-black rounded-md p-2 font-mono">
                          <div className="text-green-400">ClientActionMessage (Type 0x11)</div>
                          <div className="ml-4 text-gray-400">{`{ client_id: string, action_type: ActionType, target_id?: string, data?: any }`}</div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="server">
                      <AccordionTrigger className="text-sm">Server-to-Client Messages</AccordionTrigger>
                      <AccordionContent className="text-xs space-y-2">
                        <div className="bg-black rounded-md p-2 font-mono">
                          <div className="text-blue-400">ServerConnectResponseMessage (Type 0x81)</div>
                          <div className="ml-4 text-gray-400">{`{ client_id: string, server_time: number, success: boolean, error?: string }`}</div>
                        </div>
                        <div className="bg-black rounded-md p-2 font-mono">
                          <div className="text-blue-400">ServerHeartbeatMessage (Type 0x82)</div>
                          <div className="ml-4 text-gray-400">{`{ server_time: number }`}</div>
                        </div>
                        <div className="bg-black rounded-md p-2 font-mono">
                          <div className="text-blue-400">ServerStateUpdateMessage (Type 0x90)</div>
                          <div className="ml-4 text-gray-400">{`{ server_time: number, entities: EntityState[] }`}</div>
                        </div>
                        <div className="bg-black rounded-md p-2 font-mono">
                          <div className="text-blue-400">ServerCelestialUpdateMessage (Type 0x91)</div>
                          <div className="ml-4 text-gray-400">{`{ server_time: number, celestial_bodies: CelestialBodyState[] }`}</div>
                        </div>
                        <div className="bg-black rounded-md p-2 font-mono">
                          <div className="text-blue-400">ServerEventMessage (Type 0x94)</div>
                          <div className="ml-4 text-gray-400">{`{ event_type: EventType, data: any }`}</div>
                        </div>
                        <div className="bg-black rounded-md p-2 font-mono">
                          <div className="text-blue-400">ServerErrorMessage (Type 0xFF)</div>
                          <div className="ml-4 text-gray-400">{`{ error_code: number, error_message: string }`}</div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Unity3D Client Integration</h3>
                  <p className="text-sm text-gray-400">For Unity3D clients:</p>
                  
                  <ol className="list-decimal ml-5 text-sm space-y-2 mt-2">
                    <li>Use <code className="text-xs bg-gray-800 px-1 rounded">UdpClient</code> or a custom network library to handle UDP communication</li>
                    <li>Implement binary serialization for message types (consider using Google Protocol Buffers or a similar efficient binary format)</li>
                    <li>Set up a regular update loop to send player state (position, velocity, rotation) at 10-20Hz</li>
                    <li>Listen for state updates from the server to update other entities in the scene</li>
                    <li>Implement client-side prediction and reconciliation for smooth movement</li>
                  </ol>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card className="bg-background-dark border-gray-800 shadow-lg">
          <CardHeader className="border-b border-gray-800 py-3 px-4">
            <CardTitle className="text-base font-medium">Full HTTP API Reference</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="server">
                <AccordionTrigger className="text-sm">Server Status & Settings</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                    <span className="font-mono text-sm">/api/status</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Returns server status information</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                    <span className="font-mono text-sm">/api/settings</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Get server settings</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono bg-blue-950 text-blue-300 border-blue-700">PUT</Badge>
                    <span className="font-mono text-sm">/api/settings</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Update server settings</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                    <span className="font-mono text-sm">/api/stats</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Get server performance statistics</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                    <span className="font-mono text-sm">/api/logs</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Get server logs</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="celestial">
                <AccordionTrigger className="text-sm">Celestial Bodies</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                    <span className="font-mono text-sm">/api/celestial</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Get all celestial bodies</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                    <span className="font-mono text-sm">/api/celestial/:id</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Get a specific celestial body by ID</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono bg-green-950 text-green-300 border-green-700">POST</Badge>
                    <span className="font-mono text-sm">/api/celestial</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Create a new celestial body</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono bg-blue-950 text-blue-300 border-blue-700">PUT</Badge>
                    <span className="font-mono text-sm">/api/celestial/:id</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Update a celestial body</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono bg-red-950 text-red-300 border-red-700">DELETE</Badge>
                    <span className="font-mono text-sm">/api/celestial/:id</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Delete a celestial body</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono bg-blue-950 text-blue-300 border-blue-700">PUT</Badge>
                    <span className="font-mono text-sm">/api/celestial/simulation</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Update celestial simulation settings</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono bg-blue-950 text-blue-300 border-blue-700">PUT</Badge>
                    <span className="font-mono text-sm">/api/celestial/simulation/speed</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Update simulation speed</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="npcs">
                <AccordionTrigger className="text-sm">NPCs & Fleets</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                    <span className="font-mono text-sm">/api/npc/fleets</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Get all NPC fleets</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono bg-green-950 text-green-300 border-green-700">POST</Badge>
                    <span className="font-mono text-sm">/api/npc/fleets</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Create a new NPC fleet</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono bg-red-950 text-red-300 border-red-700">DELETE</Badge>
                    <span className="font-mono text-sm">/api/npc/fleets/:fleetId</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Delete an NPC fleet</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="players">
                <AccordionTrigger className="text-sm">Players</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                    <span className="font-mono text-sm">/api/players</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Get all connected players</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                    <span className="font-mono text-sm">/api/simulated-players</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Get all simulated players</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono bg-green-950 text-green-300 border-green-700">POST</Badge>
                    <span className="font-mono text-sm">/api/simulated-players</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Create simulated players</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono bg-red-950 text-red-300 border-red-700">DELETE</Badge>
                    <span className="font-mono text-sm">/api/simulated-players</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Delete all simulated players</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="aoi">
                <AccordionTrigger className="text-sm">Area of Interest</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                    <span className="font-mono text-sm">/api/aoi</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Get all areas of interest</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="missions">
                <AccordionTrigger className="text-sm">Missions</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                    <span className="font-mono text-sm">/api/missions</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Get all missions</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono">GET</Badge>
                    <span className="font-mono text-sm">/api/missions/:missionId</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Get a specific mission by ID</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono bg-red-950 text-red-300 border-red-700">DELETE</Badge>
                    <span className="font-mono text-sm">/api/missions/:missionId</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Delete a mission</p>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 font-mono bg-blue-950 text-blue-300 border-blue-700">PUT</Badge>
                    <span className="font-mono text-sm">/api/missions/:missionId/assign</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-14">Assign a mission to a fleet</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
        
        <Card className="bg-background-dark border-gray-800 shadow-lg">
          <CardHeader className="border-b border-gray-800 py-3 px-4">
            <CardTitle className="text-base font-medium">Unity3D Client Sample Code</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Basic Connection Example</h3>
              <p className="text-sm text-gray-400">Sample code for connecting to the server from Unity3D:</p>
              
              <div className="bg-black rounded-md p-3 font-mono text-xs mt-2 overflow-auto">
                <pre className="text-gray-300 whitespace-pre">
{`using UnityEngine;
using System;
using System.Collections;
using System.Net;
using System.Net.Sockets;
using System.Text;

public class ServerConnection : MonoBehaviour 
{
    private UdpClient client;
    private string clientId;
    private IPEndPoint serverEndPoint;
    
    [SerializeField] private string serverIp = "127.0.0.1";
    [SerializeField] private int serverPort = 7777;
    
    private void Start() 
    {
        client = new UdpClient();
        serverEndPoint = new IPEndPoint(IPAddress.Parse(serverIp), serverPort);
        
        // Connect to server
        StartCoroutine(ConnectToServer());
        
        // Start heartbeat
        StartCoroutine(SendHeartbeat());
    }
    
    private IEnumerator ConnectToServer() 
    {
        // Create connect message
        var connectMsg = new ClientConnectMessage {
            client_version = Application.version
        };
        
        // Serialize and send message
        byte[] messageBytes = SerializeMessage(MessageType.ClientConnect, connectMsg);
        client.Send(messageBytes, messageBytes.Length, serverEndPoint);
        
        Debug.Log("Sent connection request to server");
        
        // Wait for response...
        yield return new WaitForSeconds(0.5f);
        
        // Start receiving messages
        StartCoroutine(ReceiveMessages());
    }
    
    private IEnumerator SendHeartbeat() 
    {
        while (true) 
        {
            yield return new WaitForSeconds(5.0f);
            
            if (string.IsNullOrEmpty(clientId))
                continue;
                
            // Create heartbeat message
            var heartbeatMsg = new ClientHeartbeatMessage {
                client_id = clientId,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
            
            // Serialize and send message
            byte[] messageBytes = SerializeMessage(MessageType.ClientHeartbeat, heartbeatMsg);
            client.Send(messageBytes, messageBytes.Length, serverEndPoint);
        }
    }
    
    private IEnumerator ReceiveMessages() 
    {
        client.BeginReceive(OnMessageReceived, null);
        yield return null;
    }
    
    private void OnMessageReceived(IAsyncResult result) 
    {
        try 
        {
            IPEndPoint sender = new IPEndPoint(IPAddress.Any, 0);
            byte[] data = client.EndReceive(result, ref sender);
            
            // Process the message
            ProcessMessage(data);
            
            // Continue receiving
            client.BeginReceive(OnMessageReceived, null);
        }
        catch (Exception e) 
        {
            Debug.LogError($"Error receiving message: {e.Message}");
        }
    }
    
    private void ProcessMessage(byte[] data) 
    {
        // Extract message type and payload
        ushort messageType = BitConverter.ToUInt16(data, 0);
        uint length = BitConverter.ToUInt32(data, 2);
        
        // Handle different message types
        switch (messageType) 
        {
            case (ushort)MessageType.ServerConnectResponse:
                // Process connection response
                var response = DeserializeMessage<ServerConnectResponseMessage>(data, 6);
                if (response.success) 
                {
                    clientId = response.client_id;
                    Debug.Log($"Connected to server with ID: {clientId}");
                }
                else 
                {
                    Debug.LogError($"Failed to connect: {response.error}");
                }
                break;
                
            case (ushort)MessageType.ServerStateUpdate:
                // Process entity state updates
                var stateUpdate = DeserializeMessage<ServerStateUpdateMessage>(data, 6);
                UpdateEntities(stateUpdate.entities);
                break;
                
            // Handle other message types...
        }
    }
    
    // Placeholder for serialization/deserialization methods
    private byte[] SerializeMessage<T>(MessageType type, T message) 
    {
        // Implement your serialization logic here...
        return new byte[0];
    }
    
    private T DeserializeMessage<T>(byte[] data, int offset) 
    {
        // Implement your deserialization logic here...
        return default(T);
    }
    
    private void UpdateEntities(EntityState[] entities) 
    {
        // Update game objects based on entity states
        foreach (var entity in entities) 
        {
            // Find or create entity game object...
            // Update position, rotation, etc...
        }
    }
    
    private void OnDestroy() 
    {
        if (client != null && !string.IsNullOrEmpty(clientId)) 
        {
            // Send disconnect message
            var disconnectMsg = new ClientDisconnectMessage {
                client_id = clientId
            };
            
            byte[] messageBytes = SerializeMessage(MessageType.ClientDisconnect, disconnectMsg);
            client.Send(messageBytes, messageBytes.Length, serverEndPoint);
            
            client.Close();
        }
    }
    
    // Message type enum
    private enum MessageType : ushort 
    {
        // Client-to-server
        ClientConnect = 0x01,
        ClientHeartbeat = 0x02,
        ClientDisconnect = 0x03,
        ClientStateUpdate = 0x10,
        ClientAction = 0x11,
        
        // Server-to-client
        ServerConnectResponse = 0x81,
        ServerHeartbeat = 0x82,
        ServerStateUpdate = 0x90,
        ServerCelestialUpdate = 0x91,
        ServerEvent = 0x94,
        ServerError = 0xFF
    }
    
    // Message structs (placeholders, implement properly)
    private struct ClientConnectMessage { public string client_version; }
    private struct ClientHeartbeatMessage { public string client_id; public long timestamp; }
    private struct ClientDisconnectMessage { public string client_id; }
    private struct ServerConnectResponseMessage { public string client_id; public long server_time; public bool success; public string error; }
    private struct ServerStateUpdateMessage { public long server_time; public EntityState[] entities; }
    private struct EntityState { /* Entity state properties */ }
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}