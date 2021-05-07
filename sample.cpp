// ���������ģ�FightTheLandlord2����������
// ���Բ���
// ����޸ģ�2021-05-08��ȥ�����������isArray��
// ���ߣ�zhouhy
// ��Ϸ��Ϣ��http://www.botzone.org/games#FightTheLandlord2

#include <iostream>
#include <set>
#include <string>
#include <cassert>
#include <cstring> // ע��memset��cstring���
#include <algorithm>
#include "jsoncpp/json.h" // ��ƽ̨�ϣ�C++����ʱĬ�ϰ����˿�

using std::set;
using std::sort;
using std::string;
using std::unique;
using std::vector;

constexpr int PLAYER_COUNT = 3;

enum class Stage
{
	BIDDING, // �зֽ׶�
	PLAYING	 // ���ƽ׶�
};

enum class CardComboType
{
	PASS,		// ��
	SINGLE,		// ����
	PAIR,		// ����
	STRAIGHT,	// ˳��
	STRAIGHT2,	// ˫˳
	TRIPLET,	// ����
	TRIPLET1,	// ����һ
	TRIPLET2,	// ������
	BOMB,		// ը��
	QUADRUPLE2, // �Ĵ�����ֻ��
	QUADRUPLE4, // �Ĵ������ԣ�
	PLANE,		// �ɻ�
	PLANE1,		// �ɻ���С��
	PLANE2,		// �ɻ�������
	SSHUTTLE,	// ����ɻ�
	SSHUTTLE2,	// ����ɻ���С��
	SSHUTTLE4,	// ����ɻ�������
	ROCKET,		// ���
	INVALID		// �Ƿ�����
};

int cardComboScores[] = {
	0,	// ��
	1,	// ����
	2,	// ����
	6,	// ˳��
	6,	// ˫˳
	4,	// ����
	4,	// ����һ
	4,	// ������
	10, // ը��
	8,	// �Ĵ�����ֻ��
	8,	// �Ĵ������ԣ�
	8,	// �ɻ�
	8,	// �ɻ���С��
	8,	// �ɻ�������
	10, // ����ɻ�����Ҫ���У�����Ϊ10�֣�����Ϊ20�֣�
	10, // ����ɻ���С��
	10, // ����ɻ�������
	16, // ���
	0	// �Ƿ�����
};

#ifndef _BOTZONE_ONLINE
string cardComboStrings[] = {
	"PASS",
	"SINGLE",
	"PAIR",
	"STRAIGHT",
	"STRAIGHT2",
	"TRIPLET",
	"TRIPLET1",
	"TRIPLET2",
	"BOMB",
	"QUADRUPLE2",
	"QUADRUPLE4",
	"PLANE",
	"PLANE1",
	"PLANE2",
	"SSHUTTLE",
	"SSHUTTLE2",
	"SSHUTTLE4",
	"ROCKET",
	"INVALID"};
#endif

// ��0~53��54��������ʾΨһ��һ����
using Card = short;
constexpr Card card_joker = 52;
constexpr Card card_JOKER = 53;

// ������0~53��54��������ʾΨһ���ƣ�
// ���ﻹ����һ����ű�ʾ�ƵĴ�С�����ܻ�ɫ�����Ա�Ƚϣ������ȼ���Level��
// ��Ӧ��ϵ���£�
// 3 4 5 6 7 8 9 10	J Q K	A	2	С��	����
// 0 1 2 3 4 5 6 7	8 9 10	11	12	13	14
using Level = short;
constexpr Level MAX_LEVEL = 15;
constexpr Level MAX_STRAIGHT_LEVEL = 11;
constexpr Level level_joker = 13;
constexpr Level level_JOKER = 14;

/**
* ��Card���Level
*/
constexpr Level card2level(Card card)
{
	return card / 4 + card / 53;
}

// �Ƶ���ϣ����ڼ�������
struct CardCombo
{
	// ��ʾͬ�ȼ������ж�����
	// �ᰴ�����Ӵ�С���ȼ��Ӵ�С����
	struct CardPack
	{
		Level level;
		short count;

		bool operator<(const CardPack &b) const
		{
			if (count == b.count)
				return level > b.level;
			return count > b.count;
		}
	};
	vector<Card> cards;		 // ԭʼ���ƣ�δ����
	vector<CardPack> packs;	 // ����Ŀ�ʹ�С���������
	CardComboType comboType; // ���������
	Level comboLevel = 0;	 // ����Ĵ�С��

	/**
						  * ����������CardPack�ݼ��˼���
						  */
	int findMaxSeq() const
	{
		for (unsigned c = 1; c < packs.size(); c++)
			if (packs[c].count != packs[0].count ||
				packs[c].level != packs[c - 1].level - 1)
				return c;
		return packs.size();
	}

	/**
	* �������������ֵܷ�ʱ���Ȩ��
	*/
	int getWeight() const
	{
		if (comboType == CardComboType::SSHUTTLE ||
			comboType == CardComboType::SSHUTTLE2 ||
			comboType == CardComboType::SSHUTTLE4)
			return cardComboScores[(int)comboType] + (findMaxSeq() > 2) * 10;
		return cardComboScores[(int)comboType];
	}

	// ����һ��������
	CardCombo() : comboType(CardComboType::PASS) {}

	/**
	* ͨ��Card����short�����͵ĵ���������һ������
	* ����������ͺʹ�С���
	* ��������û���ظ����֣����ظ���Card��
	*/
	template <typename CARD_ITERATOR>
	CardCombo(CARD_ITERATOR begin, CARD_ITERATOR end)
	{
		// ���У���
		if (begin == end)
		{
			comboType = CardComboType::PASS;
			return;
		}

		// ÿ�����ж��ٸ�
		short counts[MAX_LEVEL + 1] = {};

		// ͬ���Ƶ��������ж��ٸ����š����ӡ�������������
		short countOfCount[5] = {};

		cards = vector<Card>(begin, end);
		for (Card c : cards)
			counts[card2level(c)]++;
		for (Level l = 0; l <= MAX_LEVEL; l++)
			if (counts[l])
			{
				packs.push_back(CardPack{l, counts[l]});
				countOfCount[counts[l]]++;
			}
		sort(packs.begin(), packs.end());

		// ���������������ǿ��ԱȽϴ�С��
		comboLevel = packs[0].level;

		// ��������
		// ���� ͬ���Ƶ����� �м��� ���з���
		vector<int> kindOfCountOfCount;
		for (int i = 0; i <= 4; i++)
			if (countOfCount[i])
				kindOfCountOfCount.push_back(i);
		sort(kindOfCountOfCount.begin(), kindOfCountOfCount.end());

		int curr, lesser;

		switch (kindOfCountOfCount.size())
		{
		case 1: // ֻ��һ����
			curr = countOfCount[kindOfCountOfCount[0]];
			switch (kindOfCountOfCount[0])
			{
			case 1:
				// ֻ�����ɵ���
				if (curr == 1)
				{
					comboType = CardComboType::SINGLE;
					return;
				}
				if (curr == 2 && packs[1].level == level_joker)
				{
					comboType = CardComboType::ROCKET;
					return;
				}
				if (curr >= 5 && findMaxSeq() == curr &&
					packs.begin()->level <= MAX_STRAIGHT_LEVEL)
				{
					comboType = CardComboType::STRAIGHT;
					return;
				}
				break;
			case 2:
				// ֻ�����ɶ���
				if (curr == 1)
				{
					comboType = CardComboType::PAIR;
					return;
				}
				if (curr >= 3 && findMaxSeq() == curr &&
					packs.begin()->level <= MAX_STRAIGHT_LEVEL)
				{
					comboType = CardComboType::STRAIGHT2;
					return;
				}
				break;
			case 3:
				// ֻ����������
				if (curr == 1)
				{
					comboType = CardComboType::TRIPLET;
					return;
				}
				if (findMaxSeq() == curr &&
					packs.begin()->level <= MAX_STRAIGHT_LEVEL)
				{
					comboType = CardComboType::PLANE;
					return;
				}
				break;
			case 4:
				// ֻ����������
				if (curr == 1)
				{
					comboType = CardComboType::BOMB;
					return;
				}
				if (findMaxSeq() == curr &&
					packs.begin()->level <= MAX_STRAIGHT_LEVEL)
				{
					comboType = CardComboType::SSHUTTLE;
					return;
				}
			}
			break;
		case 2: // ��������
			curr = countOfCount[kindOfCountOfCount[1]];
			lesser = countOfCount[kindOfCountOfCount[0]];
			if (kindOfCountOfCount[1] == 3)
			{
				// ��������
				if (kindOfCountOfCount[0] == 1)
				{
					// ����һ
					if (curr == 1 && lesser == 1)
					{
						comboType = CardComboType::TRIPLET1;
						return;
					}
					if (findMaxSeq() == curr && lesser == curr &&
						packs.begin()->level <= MAX_STRAIGHT_LEVEL)
					{
						comboType = CardComboType::PLANE1;
						return;
					}
				}
				if (kindOfCountOfCount[0] == 2)
				{
					// ������
					if (curr == 1 && lesser == 1)
					{
						comboType = CardComboType::TRIPLET2;
						return;
					}
					if (findMaxSeq() == curr && lesser == curr &&
						packs.begin()->level <= MAX_STRAIGHT_LEVEL)
					{
						comboType = CardComboType::PLANE2;
						return;
					}
				}
			}
			if (kindOfCountOfCount[1] == 4)
			{
				// ��������
				if (kindOfCountOfCount[0] == 1)
				{
					// ��������ֻ * n
					if (curr == 1 && lesser == 2)
					{
						comboType = CardComboType::QUADRUPLE2;
						return;
					}
					if (findMaxSeq() == curr && lesser == curr * 2 &&
						packs.begin()->level <= MAX_STRAIGHT_LEVEL)
					{
						comboType = CardComboType::SSHUTTLE2;
						return;
					}
				}
				if (kindOfCountOfCount[0] == 2)
				{
					// ���������� * n
					if (curr == 1 && lesser == 2)
					{
						comboType = CardComboType::QUADRUPLE4;
						return;
					}
					if (findMaxSeq() == curr && lesser == curr * 2 &&
						packs.begin()->level <= MAX_STRAIGHT_LEVEL)
					{
						comboType = CardComboType::SSHUTTLE4;
						return;
					}
				}
			}
		}

		comboType = CardComboType::INVALID;
	}

	/**
	* �ж�ָ�������ܷ�����ǰ���飨������������ǹ��Ƶ��������
	*/
	bool canBeBeatenBy(const CardCombo &b) const
	{
		if (comboType == CardComboType::INVALID || b.comboType == CardComboType::INVALID)
			return false;
		if (b.comboType == CardComboType::ROCKET)
			return true;
		if (b.comboType == CardComboType::BOMB)
			switch (comboType)
			{
			case CardComboType::ROCKET:
				return false;
			case CardComboType::BOMB:
				return b.comboLevel > comboLevel;
			default:
				return true;
			}
		return b.comboType == comboType && b.cards.size() == cards.size() && b.comboLevel > comboLevel;
	}

	/**
	* ��ָ��������Ѱ�ҵ�һ���ܴ����ǰ���������
	* ��������Ļ�ֻ����һ��
	* ����������򷵻�һ��PASS������
	*/
	template <typename CARD_ITERATOR>
	CardCombo findFirstValid(CARD_ITERATOR begin, CARD_ITERATOR end) const
	{
		if (comboType == CardComboType::PASS) // �������Ҫ���˭��ֻ��Ҫ����
		{
			CARD_ITERATOR second = begin;
			second++;
			return CardCombo(begin, second); // ��ô�ͳ���һ���ơ���
		}

		// Ȼ���ȿ�һ���ǲ��ǻ�����ǵĻ��͹�
		if (comboType == CardComboType::ROCKET)
			return CardCombo();

		// ���ڴ���������дճ�ͬ���͵���
		auto deck = vector<Card>(begin, end); // ����
		short counts[MAX_LEVEL + 1] = {};

		unsigned short kindCount = 0;

		// ����һ��������ÿ�����ж��ٸ�
		for (Card c : deck)
			counts[card2level(c)]++;

		// ������������ã�ֱ�Ӳ��ô��ˣ������ܲ���ը��
		if (deck.size() < cards.size())
			goto failure;

		// ����һ���������ж�������
		for (short c : counts)
			if (c)
				kindCount++;

		// ���򲻶�����ǰ��������ƣ������ܲ����ҵ�ƥ�������
		{
			// ��ʼ��������
			int mainPackCount = findMaxSeq();
			bool isSequential =
				comboType == CardComboType::STRAIGHT ||
				comboType == CardComboType::STRAIGHT2 ||
				comboType == CardComboType::PLANE ||
				comboType == CardComboType::PLANE1 ||
				comboType == CardComboType::PLANE2 ||
				comboType == CardComboType::SSHUTTLE ||
				comboType == CardComboType::SSHUTTLE2 ||
				comboType == CardComboType::SSHUTTLE4;
			for (Level i = 1;; i++) // �������
			{
				for (int j = 0; j < mainPackCount; j++)
				{
					int level = packs[j].level + i;

					// �����������͵����Ʋ��ܵ�2�����������͵����Ʋ��ܵ�С�������ŵ����Ʋ��ܳ�������
					if ((comboType == CardComboType::SINGLE && level > MAX_LEVEL) ||
						(isSequential && level > MAX_STRAIGHT_LEVEL) ||
						(comboType != CardComboType::SINGLE && !isSequential && level >= level_joker))
						goto failure;

					// ��������������Ʋ������Ͳ��ü�������
					if (counts[level] < packs[j].count)
						goto next;
				}

				{
					// �ҵ��˺��ʵ����ƣ���ô�����أ�
					// ������Ƶ��������������Ǵ��Ƶ��������Ͳ�����Ҳ����
					if (kindCount < packs.size())
						continue;

					// �����ڿ�����
					// ����ÿ���Ƶ�Ҫ����Ŀ��
					short requiredCounts[MAX_LEVEL + 1] = {};
					for (int j = 0; j < mainPackCount; j++)
						requiredCounts[packs[j].level + i] = packs[j].count;
					for (unsigned j = mainPackCount; j < packs.size(); j++)
					{
						Level k;
						for (k = 0; k <= MAX_LEVEL; k++)
						{
							if (requiredCounts[k] || counts[k] < packs[j].count)
								continue;
							requiredCounts[k] = packs[j].count;
							break;
						}
						if (k == MAX_LEVEL + 1) // ����Ƕ�������Ҫ�󡭡��Ͳ�����
							goto next;
					}

					// ��ʼ������
					vector<Card> solve;
					for (Card c : deck)
					{
						Level level = card2level(c);
						if (requiredCounts[level])
						{
							solve.push_back(c);
							requiredCounts[level]--;
						}
					}
					return CardCombo(solve.begin(), solve.end());
				}

			next:; // ������
			}
		}

	failure:
		// ʵ���Ҳ�����
		// ���һ���ܲ���ը��

		for (Level i = 0; i < level_joker; i++)
			if (counts[i] == 4 && (comboType != CardComboType::BOMB || i > packs[0].level)) // ����Է���ը������ը�Ĺ�����
			{
				// ������԰�����
				Card bomb[] = {Card(i * 4), Card(i * 4 + 1), Card(i * 4 + 2), Card(i * 4 + 3)};
				return CardCombo(bomb, bomb + 4);
			}

		// ��û�л����
		if (counts[level_joker] + counts[level_JOKER] == 2)
		{
			Card rocket[] = {card_joker, card_JOKER};
			return CardCombo(rocket, rocket + 2);
		}

		// ����
		return CardCombo();
	}

	void debugPrint()
	{
#ifndef _BOTZONE_ONLINE
		std::cout << "��" << cardComboStrings[(int)comboType] << "��" << cards.size() << "�ţ���С��" << comboLevel << "��";
#endif
	}
};

/* ״̬ */

// �ҵ�������Щ
set<Card> myCards;

// ������ʾ��������Щ
set<Card> landlordPublicCards;

// ��Ҵ��ʼ�����ڶ�����ʲô
vector<vector<Card>> whatTheyPlayed[PLAYER_COUNT];

// ��ǰҪ��������Ҫ���˭
CardCombo lastValidCombo;

// ��һ�ʣ������
short cardRemaining[PLAYER_COUNT] = {17, 17, 17};

// ���Ǽ�����ң�0-������1-ũ��ף�2-ũ���ң�
int myPosition;

// ����λ��
int landlordPosition = -1;

// �����з�
int landlordBid = -1;

// �׶�
Stage stage = Stage::BIDDING;

// �Լ��ĵ�һ�غ��յ��Ľз־���
vector<int> bidInput;

namespace BotzoneIO
{
	using namespace std;
	void read()
	{
		// �������루ƽ̨�ϵ������ǵ��У�
		string line;
		getline(cin, line);
		Json::Value input;
		Json::Reader reader;
		reader.parse(line, input);

		// ���ȴ����һ�غϣ���֪�Լ���˭������Щ��
		{
			auto firstRequest = input["requests"][0u]; // �±���Ҫ�� unsigned������ͨ�������ֺ����u������
			auto own = firstRequest["own"];
			for (unsigned i = 0; i < own.size(); i++)
				myCards.insert(own[i].asInt());
			if (!firstRequest["bid"].isNull())
			{
				// ��������Խз֣����¼�з�
				auto bidHistory = firstRequest["bid"];
				myPosition = bidHistory.size();
				for (unsigned i = 0; i < bidHistory.size(); i++)
					bidInput.push_back(bidHistory[i].asInt());
			}
		}

		// history���һ����ϼң��͵ڶ���ϼң��ֱ���˭�ľ���
		int whoInHistory[] = {(myPosition - 2 + PLAYER_COUNT) % PLAYER_COUNT, (myPosition - 1 + PLAYER_COUNT) % PLAYER_COUNT};

		int turn = input["requests"].size();
		for (int i = 0; i < turn; i++)
		{
			auto request = input["requests"][i];
			auto llpublic = request["publiccard"];
			if (!llpublic.isNull())
			{
				// ��һ�ε�֪�����ơ������зֺ͵�����˭
				landlordPosition = request["landlord"].asInt();
				landlordBid = request["finalbid"].asInt();
				myPosition = request["pos"].asInt();
				cardRemaining[landlordPosition] += llpublic.size();
				for (unsigned i = 0; i < llpublic.size(); i++)
				{
					landlordPublicCards.insert(llpublic[i].asInt());
					if (landlordPosition == myPosition)
						myCards.insert(llpublic[i].asInt());
				}
			}

			auto history = request["history"]; // ÿ����ʷ�����ϼҺ����ϼҳ�����
			if (history.isNull())
				continue;
			stage = Stage::PLAYING;

			// ��λָ����浽��ǰ
			int howManyPass = 0;
			for (int p = 0; p < 2; p++)
			{
				int player = whoInHistory[p];	// ��˭������
				auto playerAction = history[p]; // ������Щ��
				vector<Card> playedCards;
				for (unsigned _ = 0; _ < playerAction.size(); _++) // ѭ��ö������˳���������
				{
					int card = playerAction[_].asInt(); // �����ǳ���һ����
					playedCards.push_back(card);
				}
				whatTheyPlayed[player].push_back(playedCards); // ��¼�����ʷ
				cardRemaining[player] -= playerAction.size();

				if (playerAction.size() == 0)
					howManyPass++;
				else
					lastValidCombo = CardCombo(playedCards.begin(), playedCards.end());
			}

			if (howManyPass == 2)
				lastValidCombo = CardCombo();

			if (i < turn - 1)
			{
				// ��Ҫ�ָ��Լ�������������
				auto playerAction = input["responses"][i]; // ������Щ��
				vector<Card> playedCards;
				for (unsigned _ = 0; _ < playerAction.size(); _++) // ѭ��ö���Լ�����������
				{
					int card = playerAction[_].asInt(); // �������Լ�����һ����
					myCards.erase(card);				// ���Լ�������ɾ��
					playedCards.push_back(card);
				}
				whatTheyPlayed[myPosition].push_back(playedCards); // ��¼�����ʷ
				cardRemaining[myPosition] -= playerAction.size();
			}
		}
	}

	/**
	* ����з֣�0, 1, 2, 3 ����֮һ��
	*/
	void bid(int value)
	{
		Json::Value result;
		result["response"] = value;

		Json::FastWriter writer;
		cout << writer.write(result) << endl;
	}

	/**
	* ������ƾ��ߣ�begin�ǵ�������㣬end�ǵ������յ�
	* CARD_ITERATOR��Card����short�����͵ĵ�����
	*/
	template <typename CARD_ITERATOR>
	void play(CARD_ITERATOR begin, CARD_ITERATOR end)
	{
		Json::Value result, response(Json::arrayValue);
		for (; begin != end; begin++)
			response.append(*begin);
		result["response"] = response;

		Json::FastWriter writer;
		cout << writer.write(result) << endl;
	}
}

int main()
{
	srand(time(nullptr));
	BotzoneIO::read();

	if (stage == Stage::BIDDING)
	{
		// �������ߣ���ֻ���޸����²��֣�

		auto maxBidIt = std::max_element(bidInput.begin(), bidInput.end());
		int maxBid = maxBidIt == bidInput.end() ? -1 : *maxBidIt;

		int bidValue = rand() % (3 - maxBid) + maxBid + 1;

		// ���߽���������������ֻ���޸����ϲ��֣�

		BotzoneIO::bid(bidValue);
	}
	else if (stage == Stage::PLAYING)
	{
		// �������ߣ���ֻ���޸����²��֣�

		// findFirstValid �������������޸ĵ����
		CardCombo myAction = lastValidCombo.findFirstValid(myCards.begin(), myCards.end());

		// �ǺϷ���
		assert(myAction.comboType != CardComboType::INVALID);

		assert(
			// ���ϼ�û���Ƶ�ʱ�����
			(lastValidCombo.comboType != CardComboType::PASS && myAction.comboType == CardComboType::PASS) ||
			// ���ϼ�û���Ƶ�ʱ�����ù�����
			(lastValidCombo.comboType != CardComboType::PASS && lastValidCombo.canBeBeatenBy(myAction)) ||
			// ���ϼҹ��Ƶ�ʱ����Ϸ���
			(lastValidCombo.comboType == CardComboType::PASS && myAction.comboType != CardComboType::INVALID));

		// ���߽���������������ֻ���޸����ϲ��֣�

		BotzoneIO::play(myAction.cards.begin(), myAction.cards.end());
	}
}