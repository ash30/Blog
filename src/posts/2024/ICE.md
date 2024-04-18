---
title: ICE 
tags: [post]
date: 2024-01-30
---
# ICE 

## WHAT is it for?

- NAT traversal 

## Process 

1) GATHER - You gather a list of possible Transport IPs + PORT
- HOST IP + PORT ( doesn't usually work since local IP is generally Private ...) 
- SERVER_REFLEX + PORT ( discover your external IP via help from external service that returns the seen src IP ) 
- PEER_REFLEX + PORT ( discovered by other agent by checking src ip of STUN requests ) 
- RELAY + PORT ( worst case - can we use turn server to provide fixed connectivity ) 

2) CHECKS
You create all Pairs of (local Candidates, Remote Candidates) and STUN connectivity check them
- For ALL pairs of IP + PORT: Send to REMOTE_PEER
- REMOTE_PEER must STUN all candidates 
- hence final connectivity is a 4 way handshake - with each side stunning and receiving a response for a working set of ports

3) NOMINATION 
- The controlling agent specifices which PAIR will be used ...
> it picks a valid pair and sends a STUN request on that pair, using an attribute to indicate to the controlled peer that it has
> been nominated.
- In terms of FS, we would wait for browser to discover PEER_REFLEX ( how does that happen ? ) in order to nominate it 
> If the transactions above succeed, the agents will set the nominated flag for the pairs and will cancel any future checks
> for that component of the data stream.

## Speeding Up the Process
> Because the algorithm above searches all candidate pairs, if a working pair exists, the algorithm will eventually find it no matter 
> what order the candidates are tried in.  In order to produce faster (and better) results, the candidates are sorted in a specified order.
> The resulting list of sorted candidate pairs is called the "checklist".

> As an optimization, as soon as R gets L's check message, R schedules a connectivity-check message to be sent to L on the same candidate
> pair.  This is called a "triggered check", and it accelerates the process of finding valid pairs.

- The RFC indicates PEER_REFLEX candidates should be prioritised within the connectivity checks phase to shorten the ICE setup time 

When to start Remote PEER GATHER:
> The process for gathering candidates at the responding agent is identical to the process for the initiating agent.  It is RECOMMENDED
> that the responding agent begin this process immediately on receipt of the candidate information, prior to alerting the user of the
> application associated with the ICE session.
ie: which should start remote ice as soon as possible, NOT upon answer...

REF: https://datatracker.ietf.org/doc/html/rfc8445#section-2.1

## KEEPALives 
- ALL Reflexive candiates need to be kept alive for duration of ICE process 
- ie stop NAT killing the port!
> the bindings MUST be kept alive by additional Binding requests to the server
- Also remember that FS has a timeout for open ports... regardless of keepalives, the max_life is conntrolled by FS
- Keep alives continue even after nomination for selected candidate pair
> An agent MUST send a keepalive on each candidate pair that is used for sending data if no packet has been sent on that pair in the last
> Tr seconds.  Agents SHOULD use a Tr value of 15 seconds.  Agents MAY use a bigger value but MUST NOT use a value smaller than 15 seconds

## LibWebrtc 
LibWebrtc has some non standard configuration around ICE to provide robustness in face of networks failures:

### Weak & Strong Candidates
- It defines a WEAK and STRONG connectivity model - and alters the ping interval and timeouts accordingly.
- The idea is WEAK Connection needs to be pinged more aggressively to establish actual state of Connection.
- During STRONG connection, we can dial back the STUN pings to save cycles and bandwidth
- see config for `ice_check_interval_strong_connectivity` and `ice_check_interval_weak_connectivity`

### Continual Gather
- `continual_gathering_policy` - Continual gathering deviates from the Standard in NOT stopping ICE once nomination occurs 
and to instead continually gather ICE incase of interfaces changes.
- `ice_backup_candidate_pair_ping_interval` - similar to weak interval checks for main connection, there are seperate intervals defined for the 'backup' candidates
- ie candidates gathered after ICE candidates PAIR has been nominated, some are pruned, others kept incase we need to switch 
- ShouldSwitchConnection() - is where we swap candidate pairs
- This is ultimately called in via : onNomination, OnSelectedConnectionDestroyed, OnConnectionStateChange, SetRemoteIceParameters, SetIceConfig
- IMHO this is probably the best way to handle Network changes...

## A NOTE on ICE + TCP Support 
- ICE-TCP is a mechanism by which media is sent over TCP, but not over TURN.
- ICE-TCP is available in most browsers today (Edge pre-Chromium version doesn’t support ICE-TCP).

## Notes on TURN 
REF: https://www.rfc-editor.org/rfc/rfc8656#section-3.1
- TURN allows agent to use TCP beween AGENT AND TURN SERVER to avoid firewall that block UDP
- By Default its always UDP from TURN -> REMOTE_PEER  ( relay transport ) 
- RFC6062 is optional - the idea you can use TCP to remote PEER 
- RFC6062 is NOT supported in Webrtc 
:
