import random
import math
import json
#from sampleData import a
# 红桃 方块 黑桃 草花
# 3 4 5 6 7 8 9 10 J Q K A 2 joker & Joker
# (0-h3 1-d3 2-s3 3-c3) (4-h4 5-d4 6-s4 7-c4) …… 52-joker 53-Joker
pokerDown = [0 for i in range(54)]
solve = []
whoseTurn = -1
allocation = []
allDown = 0
# TODO: 当第一关地主pass的话会出错
try:
    full_input = json.loads(input())
    #full_input = a
    
    seedRandom = str(random.randint(0, 2147483647))

    if "initdata" not in full_input:
        full_input["initdata"] = {}
    try:
        full_input["initdata"] = json.loads(full_input["initdata"])
    except Exception:
        pass

    if "seed" in full_input["initdata"]:
        seedRandom = full_input["initdata"]["seed"]
        
    random.seed(seedRandom)

    if "allocation" in full_input["initdata"]:
        allocation = full_input["initdata"]["allocation"]
    else: # TODO：产生大家各自有什么牌
        allo = [i for i in range(54)]
        random.shuffle(allo)
        allocation = [allo[0:20], allo[20:37], allo[37:54]]

    if "publiccard" in full_input["initdata"]:
        publiccard = full_input["initdata"]["publiccard"]
    else:
        publiccard = allocation[0][0:3]

    lenLog = len(full_input["log"])
    if lenLog == 0: # judge的第一回合，处理大家有什么牌
        # content叫谁，allocation表示地主[0]:20张和农民[1]:17张 [2]:17张各自拥有什么牌
        print(json.dumps({
            "command": "request",
            "content": {
                "0": {
                    "own":allocation[0],
                    "history":[],
                    "publiccard":publiccard
                }
            },
            "display": {
                "allocation": allocation,
                "publiccard" : publiccard
            },
            "initdata": {
                "allocation": allocation,
                "publiccard" : publiccard,
                "seed": seedRandom
            }
        }))
        exit() # 直接退出

    # 之后的回合，直接读
    rest = [[i for i in j] for j in allocation]

    tmp = full_input["log"][1]["0"]["response"]
    if len(tmp) == 0: 
        whoseTurn = 0
        solve += [[]]
        raise ValueError("INVALID_PASS") # 地主第一回合就pass，显然是错误的

    for i in range(1, lenLog, 2):
        whoseTurn = (whoseTurn + 1) % 3 # 0:landlord   1,2:farmer
        restOwn = rest[whoseTurn]
		botResult = full_input["log"][i][str(whoseTurn)]
		if botResult["verdict"] != "OK":
			raise ValueError("INVALID_INPUT_VERDICT_" + botResult["verdict"])
        tmp = botResult["response"]
        solve += [tmp]
        for i in tmp:
            if i not in allocation[whoseTurn]:
                raise ValueError("MISSING_CARD") # 这个人不应该有这张牌
            if i < 0 or i > 53:
                raise ValueError("OUT_OF_RANGE") # 给的牌超出了范围
            if pokerDown[i]:
                raise ValueError("REPEATED_CARD") # 这张牌之前已经被出过了
            pokerDown[i] = True
            restOwn.remove(i)
        if len(restOwn) == 0:
            allDown = 1
        

    lenSolve = len(solve) # whoseTurn == (lenSolve - 1) % 3
    nextTurn = lenSolve % 3
    def checkPokerType(poker): # poker：list，表示一个人出牌的牌型
        poker.sort()
        lenPoker, newPoker= len(poker), [int(i/4)+3 for i in poker if i <= 52]
        if 53 in poker:
            newPoker += [17]
        # J,Q,K,A,2-11,12,13,14,15
        # 单张：1 一对：2 三带：零3、一4、二5 单顺：>=5 双顺：>=6
        # 四带二：6、8 飞机：>=6
        typeP, mP, sP = "空", newPoker, []

        for tmp in range(2):
            if tmp == 1:
                return "错误", poker, [] # 没有判断出任何牌型，出错
            if lenPoker == 0: # 没有牌，也即pass
                break
            if poker == [52, 53]:
                typeP = "火箭"
                break
            if lenPoker == 4 and newPoker.count(newPoker[0]) == 4:
                typeP = "炸弹"
                break
            if lenPoker == 1:
                typeP = "单张"
                break
            if lenPoker == 2:
                if newPoker.count(newPoker[0]) == 2:
                    typeP = "一对"
                    break
                continue
                
            firstPoker = newPoker[0]

            # 判断是否是单顺
            if lenPoker >= 5 and 15 not in newPoker:
                singleSeq = [firstPoker+i for i in range(lenPoker)]
                if newPoker == singleSeq:
                    typeP = "单顺"
                    break

            # 判断是否是双顺
            if lenPoker >= 6 and lenPoker % 2 == 0 and 15 not in newPoker:
                pairSeq = [firstPoker+i for i in range(int(lenPoker / 2))]
                pairSeq = [j for j in pairSeq for i in range(2)]
                if newPoker == pairSeq:
                    typeP = "双顺"
                    break

            thirdPoker = newPoker[2]
            # 判断是否是三带
            if lenPoker <= 5 and newPoker.count(thirdPoker) == 3:
                mP, sP = [thirdPoker for k in range(3)], [k for k in newPoker if k != thirdPoker]
                if lenPoker == 3:
                    typeP = "三带零"
                    break
                if lenPoker == 4:
                    typeP = "三带一"
                    break
                if lenPoker == 5:
                    typeP = "三带二"
                    if sP[0] == sP[1]:
                        break
                    continue

            if lenPoker < 6:
                continue

            fifthPoker = newPoker[4]
            # 判断是否是四带二
            if lenPoker == 6 and newPoker.count(thirdPoker) == 4:
                typeP, mP = "四带两只", [thirdPoker for k in range(4)]
                sP = [k for k in newPoker if k != thirdPoker]
                if sP[0] != sP[1]:
                    break
                continue
            if lenPoker == 8:
                typeP = "四带两对"
                mP, sP = [], []
                if newPoker.count(thirdPoker) == 4:
                    mP, sP = [thirdPoker for k in range(4)], [k for k in newPoker if k != thirdPoker]
                elif newPoker.count(fifthPoker) == 4:
                    mP, sP = [fifthPoker for k in range(4)], [k for k in newPoker if k != fifthPoker]
                if len(sP) == 4:
                    if sP[0] == sP[1] and sP[2] == sP[3] and sP[0] != sP[2]:
                        break

            # 判断是否是飞机or航天飞机
            singlePoker = list(set(newPoker)) # 表示newPoker中有哪些牌种
            mP, sP = newPoker, []
            dupTime = [newPoker.count(i) for i in singlePoker] # 表示newPoker中每种牌各有几张
            singleDupTime = list(set(dupTime)) # 表示以上牌数的种类
            singleDupTime.sort()

            if len(singleDupTime) == 1 and 15 not in singlePoker: # 不带翼
                lenSinglePoker, firstSP = len(singlePoker), singlePoker[0]
                tmpSinglePoker = [firstSP+i for i in range(lenSinglePoker)]
                if singlePoker == tmpSinglePoker:
                    if singleDupTime == [3]: # 飞机不带翼
                        typeP = "飞机不带翼"
                        break
                    if singleDupTime == [4]: # 航天飞机不带翼
                        typeP = "航天飞机不带翼"
                        break

            def separate(singleP, newP):
                m = [i for i in singleP if newP.count(i) >= 3]
                s = [i for i in singleP if newP.count(i) < 3]
                return m, s

            m, s = [], []
            if len(singleDupTime) == 2 and singleDupTime[0] < 3 and singleDupTime[1] >= 3:
                c1, c2 = dupTime.count(singleDupTime[0]), dupTime.count(singleDupTime[1])
                if c1 != c2 and not (c1 == 4 and c2 == 2): # 带牌的种类数不匹配
                    continue
                m, s = separate(singlePoker, newPoker) # 都是有序的
                if 15 in m:
                    continue
                lenm, firstSP = len(m), m[0]
                tmpm = [firstSP+i for i in range(lenm)]
                if m == tmpm: # [j for j in pairSeq for i in range(2)]
                    m = [j for j in m for i in range(singleDupTime[1])]
                    s = [j for j in s for i in range(singleDupTime[0])]
                    if singleDupTime[1] == 3:
                        if singleDupTime[0] == 1:
                            typeP = "飞机带小翼"
                            mP, sP = m, s
                            break
                        if singleDupTime[0] == 2:
                            typeP = "飞机带大翼"
                            mP, sP = m, s
                            break
                    elif singleDupTime[1] == 4:
                        if singleDupTime[0] == 1:
                            typeP = "航天飞机带小翼"
                            mP, sP = m, s
                            break
                        if singleDupTime[0] == 2:
                            typeP = "航天飞机带大翼"
                            mP, sP = m, s
                            break
        
        omP, osP = [], []
        for i in poker:
            tmp = int(i/4)+3
            if i == 53:
                tmp = 17
            if tmp in mP:
                omP += [i]
            elif tmp in sP:
                osP += [i]
            else:
                return "错误", poker, []
        return typeP, omP, osP
        
    def recover(history): # 只考虑倒数3个，返回最后一个有效牌型及主从牌，且返回之前有几个人选择了pass；id是为了防止某一出牌人在某一牌局后又pass，然后造成连续pass
        lenHistory = len(history)
        typeP, mP, sP, countPass = "任意出", [], [], 0

        while(lenHistory > 0):
            lastPoker = history[lenHistory - 1]
            typeP, mP, sP = checkPokerType(lastPoker)
            if typeP == "空":
                countPass += 1
                lenHistory -= 1
                continue
            break
        return typeP, mP, sP, countPass
        
    priorityPokerType = {
        "火箭":3,
        "炸弹":2,
        "单张":1,
        "一对":1,
        "单顺":1,
        "双顺":1,
        "三带零":1,
        "三带一":1,
        "三带二":1,
        "四带两只":1,
        "四带两对":1,
        "飞机不带翼":1,
        "航天飞机不带翼":1,
        "飞机带小翼":1,
        "飞机带大翼":1,
        "航天飞机带小翼":1,
        "航天飞机带大翼":1
    }
    currTypeP, currMP, currSP = checkPokerType(solve[-1])
    if currTypeP == "错误":
        raise ValueError("INVALID_CARDTYPE") # 牌型错误
    lastTypeP, lastMP, lastSP, countPass = recover(solve[:-1])
    if lastTypeP == "任意出" or lastTypeP == "空" or countPass == 2:
        if currTypeP == "空":
            raise ValueError("INVALID_PASS") # 不合理的pass，显然是错误的
        else: # 任意出或者前二者都不要的话，自己可以随意出，因为上一轮也是自己的牌
            if allDown: # 这一回合的出牌者已经把牌都出完了，赢得了最终胜利
                score = []
                if whoseTurn and 1:
                    score = [0, 2, 2]
                else:
                    score = [2, 0, 0]
                print(json.dumps({
                    "command": "finish",
                    "content": {
                        "0": score[0],
                        "1": score[1],
                        "2": score[2]
                    },
                    "display": {
                        "event": {
                            "player": whoseTurn,
                            "action": solve[-1]
                        },
                        "0": score[0],
                        "1": score[1],
                        "2": score[2]
                    }
                }))            
            else:
                print(json.dumps({
                    "command": "request",
                    "content": {
                        str(nextTurn): {
                            "own": allocation[nextTurn],
                            "history": solve,
                            "publiccard": publiccard
                        }
                    },
                    "display": {
                        "event": {
                            "player": whoseTurn,
                            "action": solve[-1]
                        }
                    }
                }))
            exit()
    if currTypeP == "空":
        print(json.dumps({
            "command": "request",
            "content": {
                str(nextTurn): {
                    "own": allocation[nextTurn],
                    "history": solve,
                    "publiccard": publiccard
                }
            },
            "display": {
                "event": {
                    "player": whoseTurn,
                    "action": solve[-1]
                }
            }
        }))
        exit()
    lastPPT, currPPT = priorityPokerType[lastTypeP], priorityPokerType[currTypeP]
    if lastPPT < currPPT: # 现在的牌型比上一个牌型要大，直接过
        print(json.dumps({
            "command": "request",
            "content": {
                str(nextTurn): {
                    "own": allocation[nextTurn],
                    "history": solve,
                    "publiccard": publiccard
                }
            },
            "display": {
                "event": {
                    "player": whoseTurn,
                    "action": solve[-1]
                }
            }
        }))
        exit()
    if lastPPT > currPPT:
        raise ValueError("LESS_COMPARE") # 现在的牌型比上一个牌型要小
    if lastTypeP != currTypeP:
        raise ValueError("MISMATCH_CARDTYPE") # 牌型不一致
    lenCom = len(currMP)
    if len(lastMP) != lenCom or len(currSP) != len(lastSP):
        raise ValueError("MISMATCH_CARDLENGTH") # 牌型长度不一致
    currComMP, lastComMP = [int(i/4)+3 for i in currMP if i <= 52], [int(i/4)+3 for i in lastMP if i <= 52]
    if 53 in currMP:
        currComMP += [17]
    if 53 in lastComMP:
        lastComMP += [17]
    
    comRes = [currComMP[i] > lastComMP[i] for i in range(lenCom)]
    if all(comRes):
        if allDown: # 这一回合的出牌者已经把牌都出完了，赢得了最终胜利
            score = []
            if whoseTurn and 1:
                score = [0, 2, 2]
            else:
                score = [2, 0, 0]
            print(json.dumps({
                "command": "finish",
                "content": {
                    "0": score[0],
                    "1": score[1],
                    "2": score[2]
                },
                "display": {
                    "event": {
                        "player": whoseTurn,
                        "action": solve[-1]
                    },
                    "0": score[0],
                    "1": score[1],
                    "2": score[2]
                }
            }))            
        else:
            print(json.dumps({
                "command": "request",
                "content": {
                    str(nextTurn): {
                        "own": allocation[nextTurn],
                        "history": solve,
                        "publiccard": publiccard
                    }
                },
                "display": {
                    "event": {
                        "player": whoseTurn,
                        "action": solve[-1]
                    }
                }
            }))
        exit()
    else:
        raise ValueError("LESS_COMPARE") # 现在的牌型比上一个牌型要小

except ValueError as ex:
    # 这一回合的出牌者有问题
    score = []
    if whoseTurn == 0:
        score = [0, 2, 2]
    else:
        score = [2, 0, 0]
    print(json.dumps({
            "command": "finish",
            "content": {
                "0": score[0],
                "1": score[1],
                "2": score[2]
            },
            "display": {
                "event": {
                    "player": whoseTurn,
                    "action": solve[-1]
                },
                "errorInfo": str(ex),
                "0": score[0],
                "1": score[1],
                "2": score[2]
            }
        }))
except Exception:
    # 这一回合的出牌者有问题
    score = []
    if whoseTurn == 0:
        score = [0, 2, 2]
    else:
        score = [2, 0, 0]
    print(json.dumps({
            "command": "finish",
            "content": {
                "0": score[0],
                "1": score[1],
                "2": score[2]
            },
            "display": {
                "event": {
                    "player": whoseTurn,
                    "action": solve[-1]
                },
                "errorInfo": "BAD_FORMAT",
                "0": score[0],
                "1": score[1],
                "2": score[2]
            }
        }))