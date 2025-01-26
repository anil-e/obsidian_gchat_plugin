import {
	App,
	CachedMetadata,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	requestUrl,
} from "obsidian";
import { GChatReminderSettings, Task } from "types";

const DEFAULT_SETTINGS: GChatReminderSettings = {
	webhookUrl: "",
	notifiedTasks: [],
};

export default class GChatReminder extends Plugin {
	settings: GChatReminderSettings;
	notifiedTasks: Set<string> = new Set();
	taskCache: Set<Task> = new Set();

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new Settingstab(this.app, this));

		this.registerEvent(
			this.app.metadataCache.on(
				"changed",
				this.handleFileChange.bind(this)
			)
		);

		this.registerInterval(
			setInterval(this.checkTasks.bind(this), 3 * 60 * 1000) as any
		);

		this.initializeTaskCache();
	}

	async initializeTaskCache() {
		this.taskCache = new Set();
		const files = this.app.vault.getMarkdownFiles();
		for (const file of files) {
			this.addToTaskCache(file);
		}
	}

	handleFileChange(file: TFile, _data: string, _cache: CachedMetadata) {
		this.addToTaskCache(file);
	}

	async addToTaskCache(file: TFile) {
		if (file.extension !== "md") return;

		const fileContent = await this.app.vault.read(file);
		const tasks = this.extractTasks(fileContent);
		tasks.forEach((task) => this.taskCache.add(task));
	}

	checkTasks() {
		this.taskCache.forEach((task) => {
			const { content, dueDateTime } = task;
			this.checkTask(content, dueDateTime);
		});
	}

	extractTasks(content: string) {
		const regex = /(.*?)(\(gChat@(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\))/g;
		let match;
		const tasks = [];

		while ((match = regex.exec(content)) !== null) {
			let reminderText = match[1].trim();

			if (reminderText.startsWith("- [ ]")) {
				reminderText = reminderText.replace("- [ ]", "").trim();
			}

			const dueDateTime = new Date(match[3]);
			tasks.push({ content: reminderText, dueDateTime });
		}

		return tasks;
	}

	async checkTask(content: string, dueDateTime: Date) {
		const now = new Date();
		const taskId = `${content}-${dueDateTime.toISOString()}`;

		if (dueDateTime <= now && !this.notifiedTasks.has(taskId)) {
			this.notifiedTasks.add(taskId);
			this.saveSettings();
			this.sendNotification(content, dueDateTime.toISOString());
		}
	}

	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
		this.notifiedTasks = new Set(this.settings.notifiedTasks ?? []);
	}

	async saveSettings() {
		this.settings.notifiedTasks = [...this.notifiedTasks];
		await this.saveData(this.settings);
	}

	async sendNotification(reminderText: string, dateTime: string) {
		const { webhookUrl } = this.settings;

		if (!webhookUrl || webhookUrl.trim() === "") {
			console.warn(
				"GChat webhook URL is not set. Notification is not sent."
			);
			return;
		}

		const payload = {
			thread: {
				threadKey: `${reminderText}-${dateTime}`,
			},
			cardsV2: [
				{
					cardId: `${reminderText}-${dateTime}`,
					card: {
						header: {
							title: "Obsdian",
							subtitle: "Task is due!",
							imageUrl:
								"https://obsidian.md/images/2023-06-logo.png",
							imageType: "CIRCLE",
						},
						sections: [
							{
								header: dateTime,
								widgets: [
									{
										textParagraph: {
											text: reminderText,
										},
									},
								],
							},
						],
					},
				},
			],
		};

		try {
			const response = await requestUrl({
				method: "POST",
				url: `${webhookUrl}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD`,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (response.status != 200) {
				console.error("Error sending Google Chat Notifcation:");
			}
		} catch (error) {
			console.error("Error sending Google Chat Notifcation:", error);
		}
	}
}

class Settingstab extends PluginSettingTab {
	plugin: GChatReminder;

	constructor(app: App, plugin: GChatReminder) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Webhook-URL")
			.setDesc("URL to which the notifications are sent")
			.addText((text) =>
				text
					.setPlaceholder("Enter your URL")
					.setValue(this.plugin.settings.webhookUrl)
					.onChange(async (value) => {
						this.plugin.settings.webhookUrl = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
