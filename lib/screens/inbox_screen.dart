import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  final _api = const ApiService();
  List<InboxMessage> _messages = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final messages = await _api.fetchInbox();
    if (!mounted) return;
    setState(() {
      _messages = messages;
      _loading = false;
    });
  }

  Color _statusColor(MessageStatus status) {
    switch (status) {
      case MessageStatus.unread:
        return AppTheme.primary;
      case MessageStatus.read:
        return Colors.grey;
      case MessageStatus.urgent:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }

    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _messages.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final msg = _messages[index];
          final isUnread = msg.status != MessageStatus.read;

          return Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {},
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: _statusColor(msg.status).withValues(alpha: 0.12),
                      child: Icon(
                        msg.status == MessageStatus.urgent
                            ? Icons.priority_high
                            : Icons.mail_outline,
                        color: _statusColor(msg.status),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  msg.sender,
                                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                        fontWeight: isUnread ? FontWeight.w800 : FontWeight.w600,
                                      ),
                                ),
                              ),
                              Text(
                                msg.time,
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: Colors.grey.shade500,
                                    ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            msg.subject,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  fontWeight: isUnread ? FontWeight.w700 : FontWeight.w500,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            msg.preview,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.grey.shade600,
                                ),
                          ),
                          const SizedBox(height: 8),
                          Chip(
                            label: Text(msg.channel),
                            visualDensity: VisualDensity.compact,
                            backgroundColor: AppTheme.primary.withValues(alpha: 0.08),
                            labelStyle: const TextStyle(
                              color: AppTheme.primary,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
