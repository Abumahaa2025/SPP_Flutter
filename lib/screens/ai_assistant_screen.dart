import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../providers/app_state.dart';
import '../widgets/ai_orb.dart';
import '../widgets/glass_card.dart';
import '../widgets/reference_widgets.dart';

class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final _controller = TextEditingController();
  final _scroll = ScrollController();

  static const _quickPrompts = [
    'أرني أداء العقار هذا الشهر',
    'توقع احتياجات الصيانة',
    'حلل الإشعارات',
    'من المتأخر بالسداد؟',
  ];

  @override
  void dispose() {
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _send(String text) {
    if (text.trim().isEmpty) return;
    context.read<AppState>().askBrain(text.trim());
    _controller.clear();
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final chat = context.watch<AppState>().chat;
    final name = context.watch<AppState>().platform?.ownerName.split(' ').first ?? 'أحمد';

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('المساعد الذكي'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
      ),
      body: Container(
        decoration: BoxDecoration(gradient: AppColors.aiScreenGradient),
        child: Column(
          children: [
            const SizedBox(height: kToolbarHeight + 8),
            const LivingAiOrb(size: 130, heroTag: 'main-orb', luxury: true),
            const SizedBox(height: 20),
            Text(
              'مرحباً $name، كيف أساعدك اليوم؟',
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 2.2,
                children: _quickPrompts
                    .map((p) => GlassPromptPill(text: p, onTap: () => _send(p)))
                    .toList(),
              ),
            ),
            const SizedBox(height: 16),
            if (chat.isNotEmpty)
              Expanded(
                child: ListView.builder(
                  controller: _scroll,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: chat.length,
                  itemBuilder: (context, i) => _Bubble(message: chat[i]),
                ),
              )
            else
              const Spacer(),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: GlassCard(
                  blur: 20,
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(PremiumIcons.mic, color: AppColors.accent),
                      ),
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          style: const TextStyle(color: Colors.white),
                          onSubmitted: _send,
                          decoration: InputDecoration(
                            hintText: 'اسأل أي شيء...',
                            hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.45)),
                            border: InputBorder.none,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => _send(_controller.text),
                        icon: const Icon(PremiumIcons.send, color: AppColors.accent),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message});
  final dynamic message;

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser as bool;
    return Align(
      alignment: isUser ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
        decoration: BoxDecoration(
          color: isUser ? AppColors.aiIndigo.withValues(alpha: 0.35) : Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        ),
        child: Text(message.text as String, style: const TextStyle(color: Colors.white, height: 1.45)),
      ),
    ).animate().fadeIn(duration: 250.ms);
  }
}
